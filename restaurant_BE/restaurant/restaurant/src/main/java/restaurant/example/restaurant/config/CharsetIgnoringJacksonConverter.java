package restaurant.example.restaurant.config;

import java.io.IOException;
import java.nio.charset.Charset;

import org.springframework.http.HttpInputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

/**
 * Custom Jackson converter that ignores charset parameter in Content-Type header.
 * This allows Spring to accept "application/json;charset=UTF-8" by treating it
 * the same as "application/json".
 */
public class CharsetIgnoringJacksonConverter extends MappingJackson2HttpMessageConverter {

    @Override
    public boolean canRead(Class<?> clazz, MediaType mediaType) {
        if (mediaType != null && mediaType.getType().equals("application") 
                && mediaType.getSubtype().equals("json")) {
            // Ignore charset parameter - treat as application/json
            return super.canRead(clazz, MediaType.APPLICATION_JSON);
        }
        return super.canRead(clazz, mediaType);
    }

    @Override
    protected Object readInternal(Class<?> clazz, HttpInputMessage inputMessage)
            throws IOException, HttpMessageNotReadableException {
        // Normalize Content-Type by removing charset
        MediaType contentType = inputMessage.getHeaders().getContentType();
        if (contentType != null && contentType.getType().equals("application") 
                && contentType.getSubtype().equals("json")) {
            // Create a new MediaType without charset
            MediaType normalizedType = new MediaType(
                contentType.getType(),
                contentType.getSubtype()
            );
            // Create a wrapper that returns normalized MediaType
            HttpInputMessage normalizedMessage = new HttpInputMessage() {
                @Override
                public java.io.InputStream getBody() throws IOException {
                    return inputMessage.getBody();
                }

                @Override
                public org.springframework.http.HttpHeaders getHeaders() {
                    org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders(inputMessage.getHeaders());
                    headers.setContentType(normalizedType);
                    return headers;
                }
            };
            return super.readInternal(clazz, normalizedMessage);
        }
        return super.readInternal(clazz, inputMessage);
    }
}

