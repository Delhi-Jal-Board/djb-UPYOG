package org.egov.pg.config.scheduler;

import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.IOException;

public class AuthHeaderInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            // First try to get the standard Authorization header
            String authToken = attributes.getRequest().getHeader("Authorization");

            // Fallback to the custom auth-token header if Authorization is missing
            if (authToken == null || authToken.trim().isEmpty()) {
                authToken = attributes.getRequest().getHeader("auth-token");
            }

            if (authToken != null && !authToken.trim().isEmpty()) {

                // 1. Set the standard Authorization header with the Bearer prefix
                if (!authToken.toLowerCase().startsWith("bearer ")) {
                    request.getHeaders().add("Authorization", "Bearer " + authToken);
                } else {
                    request.getHeaders().add("Authorization", authToken);
                }

                // 2. Set the custom auth-token header without the Bearer prefix
                // (Crucial for some internal DIGIT microservices)
                String rawToken = authToken.toLowerCase().startsWith("bearer ") ? authToken.substring(7).trim() : authToken;
                request.getHeaders().add("auth-token", rawToken);
            }
        }

        return execution.execute(request, body);
    }
}
