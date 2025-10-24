package restaurant.example.restaurant.util;

import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import jakarta.servlet.http.HttpServletResponse;
import restaurant.example.restaurant.domain.response.RestResponse;
import restaurant.example.restaurant.util.anotation.ApiMessage;

//  file này có nghĩa là trước khi phản hồi lại dười dùng thì format lại dữ liệu
@ControllerAdvice
public class FormatRestResponse implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {
        HttpServletResponse servletResponse = ((ServletServerHttpResponse) response).getServletResponse();
        int status = servletResponse.getStatus();
        // TODO Auto-generated method stub
        RestResponse<Object> res = new RestResponse<Object>();
        res.setStatusCode(status);

        //
        if (body instanceof String || body instanceof Resource) {
            return body;
        }

        if (status >= 400) {
            return body;

        } else {
            ApiMessage message = returnType.getMethodAnnotation(ApiMessage.class);
            res.setData(body);
            res.setMessage(message != null ? message.value() : "Call Api Success");
        }
        return res;
    }

}
