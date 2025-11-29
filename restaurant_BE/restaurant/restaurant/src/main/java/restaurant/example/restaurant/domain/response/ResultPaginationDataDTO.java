package restaurant.example.restaurant.domain.response;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
public class ResultPaginationDataDTO<T> {
    private List<T> result;
    private Meta meta;

    @Data
    public static class Meta {
        private int page;
        private int pageSize;
        private int pages;
        private long total;
    }

    public static <T> ResultPaginationDataDTO<T> fromPage(Page<T> page) {
        ResultPaginationDataDTO<T> result = new ResultPaginationDataDTO<>();
        result.setResult(page.getContent());
        
        Meta meta = new Meta();
        meta.setPage(page.getNumber() + 1); // Convert to 1-based index
        meta.setPageSize(page.getSize());
        meta.setPages(page.getTotalPages());
        meta.setTotal(page.getTotalElements());
        
        result.setMeta(meta);
        return result;
    }
}
