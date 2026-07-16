package org.egov.pg.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class AuthTokenFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // Initialization if needed
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String requestURI = httpRequest.getRequestURI();

        // We only want to apply this logic to the _redirect API
        if (requestURI != null && requestURI.contains("/transaction/v1/_redirect")) {
            String authTokenParam = httpRequest.getParameter("auth-token");

            log.info("AuthTokenFilter intercepting _redirect call. URL parameters auth-token present: {}",
                    (authTokenParam != null && !authTokenParam.isEmpty()));

            if (authTokenParam != null && !authTokenParam.isEmpty()) {
                // Wrap the request to inject headers
                HeaderMapRequestWrapper requestWrapper = new HeaderMapRequestWrapper(httpRequest);

                // If it doesn't already have Bearer prefix, add it.
                String bearerToken = authTokenParam.startsWith("Bearer ") ? authTokenParam : "Bearer " + authTokenParam;

                requestWrapper.addHeader("Authorization", bearerToken);
                requestWrapper.addHeader("auth-token", authTokenParam);
                log.info("AuthTokenFilter injected Authorization header successfully.");
                chain.doFilter(requestWrapper, response);
                return;
            }
        }

        // Pass the request along unchanged if it's not a _redirect or lacks the token param
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // Cleanup if needed
    }
}