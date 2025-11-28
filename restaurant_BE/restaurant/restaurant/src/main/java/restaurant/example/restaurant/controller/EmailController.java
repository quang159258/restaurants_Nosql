package restaurant.example.restaurant.controller;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import restaurant.example.restaurant.service.EmailService;
import restaurant.example.restaurant.util.anotation.ApiMessage;

@RestController
public class EmailController {
    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping("/email")
    @ApiMessage("Send simple email")
    // @Transactional
    public String sendSimpleEmail() {
        // this.emailService.sendEmailFromTemplateSync("nguyenthanhhoan300904@gmail.com",
        // "test send email", "job");
        return "ok";
    }
}
