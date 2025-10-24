package restaurant.example.restaurant.service;

import org.springframework.stereotype.Service;

import restaurant.example.restaurant.repository.CartDetailRepository;
import restaurant.example.restaurant.repository.CartRepository;

@Service
public class CartDetailService {

    private final CartRepository cartRepository;
    private final CartDetailRepository cartDetailRepository;

    public CartDetailService(CartDetailRepository cartDetailRepository, CartRepository cartRepository) {
        this.cartDetailRepository = cartDetailRepository;
        this.cartRepository = cartRepository;
    }

    public void handleDeleteByID(Long id) {
        this.cartDetailRepository.deleteById(id);
    }

}
