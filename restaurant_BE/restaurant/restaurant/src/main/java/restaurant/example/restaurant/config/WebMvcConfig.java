package restaurant.example.restaurant.config;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration to support Content-Type with charset parameter.
 * Replaces default Jackson converter with custom one that ignores charset.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        // Replace default MappingJackson2HttpMessageConverter with our custom one
        for (int i = 0; i < converters.size(); i++) {
            if (converters.get(i) instanceof MappingJackson2HttpMessageConverter) {
                // Replace with custom converter that ignores charset
                converters.set(i, new CharsetIgnoringJacksonConverter());
                break;
            }
        }
    }
}

