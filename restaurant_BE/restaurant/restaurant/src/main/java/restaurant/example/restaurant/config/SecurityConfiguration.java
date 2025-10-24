package restaurant.example.restaurant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.oauth2.server.resource.web.access.BearerTokenAccessDeniedHandler;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.MvcRequestMatcher;
import org.springframework.web.servlet.handler.HandlerMappingIntrospector;

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
                        CustomAuthenticationEntryPoint customAuthenticationEntryPoint) throws Exception {
                http
                                .csrf(c -> c.disable())
                                .authorizeHttpRequests(
                                                authz -> authz
                                                                .requestMatchers(
                                                                                "/",
                                                                                "/api/v1/auth/login",
                                                                                "/api/v1/auth/refresh",
                                                                                "/api/v1/auth/logout",
                                                                                "/api/v1/auth/account",
                                                                                "/storage/**",
                                                                                "/api/v1/auth/register",
                                                                                "/category",
                                                                                "/dish",
                                                                                "/flies/**",
                                                                                "/pre-signed-url/**",
                                                                                "/cart/call-back-vnpay",
                                                                                "/email")
                                                                .permitAll()
                                                                .anyRequest().authenticated())
                                .oauth2ResourceServer((oauth2) -> oauth2.jwt(Customizer.withDefaults())
                                                .authenticationEntryPoint(customAuthenticationEntryPoint))
                                // .exceptionHandling(
                                // exceptions -> exceptions
                                // .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint()) // 401
                                // .accessDeniedHandler(new BearerTokenAccessDeniedHandler())) // 403

                                // custom
                                .formLogin(f -> f.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS));

                return http.build();
        }

        @Bean
        MvcRequestMatcher.Builder mvc(HandlerMappingIntrospector introspector) {
                return new MvcRequestMatcher.Builder(introspector);
        }
}
