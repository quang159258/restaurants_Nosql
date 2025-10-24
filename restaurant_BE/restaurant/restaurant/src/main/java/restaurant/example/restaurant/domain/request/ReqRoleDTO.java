package restaurant.example.restaurant.domain.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ReqRoleDTO {
    private Long id;
    
    @NotBlank(message = "Name không được để trống")
    private String name;
    
    @NotBlank(message = "Description không được để trống")
    private String description;
    
    private List<Long> permissionIds;
}

