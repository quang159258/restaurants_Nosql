package restaurant.example.restaurant.config;

import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import restaurant.example.restaurant.service.SessionService;

public class SessionValidationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(SessionValidationFilter.class);

    private static final String SESSION_COOKIE_NAME = "SESSIONID";
    private static final Set<String> IGNORED_PATHS = new HashSet<>(
            Arrays.asList(
                    "/api/v1/auth/login",
                    "/api/v1/auth/register",
                    "/api/v1/auth/refresh"));

    private final SessionService sessionService;

    public SessionValidationFilter(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String uri = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return IGNORED_PATHS.contains(uri);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            String sessionId = extractSessionId(request);
            if (!StringUtils.hasText(sessionId)) {
                filterChain.doFilter(request, response);
                return;
            }
            try {
                if (sessionService.getUserIdFromSession(sessionId) == null) {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.getWriter().write("SESSION_EXPIRED");
                    return;
                }
            } catch (Exception e) {
                // Redis down - fail closed: deny access for security
                log.error("Redis unavailable during session validation, denying access for session: {}", sessionId, e);
                response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
                response.getWriter().write("SESSION_SERVICE_UNAVAILABLE");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private String extractSessionId(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (SESSION_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}

