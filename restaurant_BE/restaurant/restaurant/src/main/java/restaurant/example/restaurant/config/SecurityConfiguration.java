package restaurant.example.restaurant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

import restaurant.example.restaurant.service.SessionService;

@Configuration
// anotation được hiểu là cấu hình lại config mặc định (ghi đè)

@EnableMethodSecurity(securedEnabled = true)
public class SecurityConfiguration {
        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http,
                        CustomAuthenticationEntryPoint customAuthenticationEntryPoint,
                        SessionValidationFilter sessionValidationFilter) throws Exception {
                http
                                .csrf(c -> c.disable())
                                .authorizeHttpRequests(
                                                authz -> authz
                                                                .requestMatchers(
                                                                                "/",
                                                                                "/storage/**",
                                                                                "/files/**",
                                                                                "/images/**",
                                                                "/ws/**",
                                                                                "/pre-signed-url/**",
                                                                                "/cart/call-back-vnpay",
                                                                                "/email")
                                                                .permitAll()
                                                                .requestMatchers(
                                                                                "/api/v1/auth/login",
                                                                                "/api/v1/auth/register",
                                                                                "/api/v1/auth/refresh")
                                                                .permitAll()
                                                                .requestMatchers(HttpMethod.GET, "/category/**",
                                                                                "/dish/**")
                                                                .permitAll()
                                                                .anyRequest().authenticated())
                                .exceptionHandling(exceptions -> exceptions
                                                .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                                                .accessDeniedHandler(new BearerTokenAccessDeniedHandler()))
                                .oauth2ResourceServer((oauth2) -> oauth2.jwt(Customizer.withDefaults())
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                                // custom
                                .formLogin(f -> f.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .addFilterAfter(sessionValidationFilter, BearerTokenAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        MvcRequestMatcher.Builder mvc(HandlerMappingIntrospector introspector) {
                return new MvcRequestMatcher.Builder(introspector);
        }

        @Bean
        public SessionValidationFilter sessionValidationFilter(SessionService sessionService) {
                return new SessionValidationFilter(sessionService);
        }
}
