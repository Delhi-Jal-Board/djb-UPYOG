package org.egov.web.notification.sms;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.*;
import org.egov.hash.HashService;
import org.egov.tracer.config.TracerConfiguration;
import org.egov.web.notification.sms.config.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.*;
import org.springframework.context.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.*;
import org.springframework.kafka.annotation.*;
import org.springframework.util.*;
import org.springframework.web.client.RestTemplate;

import org.apache.http.client.config.RequestConfig;
import org.apache.http.config.RegistryBuilder;
import org.apache.http.conn.socket.ConnectionSocketFactory;
import org.apache.http.conn.socket.PlainConnectionSocketFactory;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.DefaultConnectionKeepAliveStrategy;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.ssl.SSLContexts;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import javax.annotation.*;
import javax.net.ssl.SSLContext;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@SpringBootApplication
@Import(TracerConfiguration.class)
@Slf4j
@EnableKafka
public class EgovNotificationSmsApplication {

    @Autowired
    private ApplicationContext context;

    @Autowired
    private Environment environment;

    public static void main(String[] args) {
        SpringApplication.run(EgovNotificationSmsApplication.class, args);
    }

    @PostConstruct
    private void init() {
        if (StringUtils.isEmpty(environment.getProperty("sms.provider.class"))) {
            log.error("The provider gateway has not been configured. Please configure sms.provider.class");
            int exitCode = SpringApplication.exit(context, (ExitCodeGenerator) () -> 1);
            System.exit(exitCode);
        }
    }

    @Primary
    @Bean
    public RestTemplate getRestTemplate(
            @Value("${http.pool.max.total:200}") int maxTotal,
            @Value("${http.pool.default.max.per.route:50}") int defaultMaxPerRoute,
            @Value("${http.connect.timeout:5000}") int connectTimeout,
            @Value("${http.socket.timeout:10000}") int socketTimeout,
            @Value("${http.connection.request.timeout:3000}") int connectionRequestTimeout) {
        try {
            SSLContext sslContext = SSLContexts.custom()
                    .loadTrustMaterial(null, (chain, authType) -> true)
                    .build();

            SSLConnectionSocketFactory csf = new SSLConnectionSocketFactory(
                    sslContext,
                    NoopHostnameVerifier.INSTANCE
            );

            PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager(
                    RegistryBuilder.<ConnectionSocketFactory>create()
                            .register("http", PlainConnectionSocketFactory.getSocketFactory())
                            .register("https", csf)
                            .build()
            );
            connectionManager.setMaxTotal(maxTotal);
            connectionManager.setDefaultMaxPerRoute(defaultMaxPerRoute);

            RequestConfig requestConfig = RequestConfig.custom()
                    .setConnectTimeout(connectTimeout)
                    .setSocketTimeout(socketTimeout)
                    .setConnectionRequestTimeout(connectionRequestTimeout)
                    .build();

            CloseableHttpClient httpClient = HttpClients.custom()
                    .setConnectionManager(connectionManager)
                    .setDefaultRequestConfig(requestConfig)
                    .setSSLSocketFactory(csf)
                    .setSSLHostnameVerifier(NoopHostnameVerifier.INSTANCE)
                    .setKeepAliveStrategy(new DefaultConnectionKeepAliveStrategy())
                    .build();

            HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactory();
            requestFactory.setHttpClient(httpClient);
            return new RestTemplate(requestFactory);
        } catch (Exception e) {
            log.error("Failed to initialize pooling RestTemplate, using fallback", e);
            HttpComponentsClientHttpRequestFactory fallbackFactory = new HttpComponentsClientHttpRequestFactory();
            fallbackFactory.setConnectTimeout(connectTimeout);
            fallbackFactory.setReadTimeout(socketTimeout);
            return new RestTemplate(fallbackFactory);
        }
    }

    @Bean(name = "notificationExecutor")
    public Executor notificationExecutor(
            @Value("${notification.thread.pool.core.size:20}") int coreSize,
            @Value("${notification.thread.pool.max.size:100}") int maxSize,
            @Value("${notification.thread.pool.queue.capacity:500}") int queueCapacity) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(coreSize);
        executor.setMaxPoolSize(maxSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setThreadNamePrefix("notif-worker-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Primary
    @Bean
    public HashService getHashService() {
        return new HashService();
    }
    
    @Bean
    public ObjectMapper objectMapper(){
        return new ObjectMapper()
                .configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true)
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    }
}
