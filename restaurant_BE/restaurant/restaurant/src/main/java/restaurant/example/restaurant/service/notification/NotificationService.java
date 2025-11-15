package restaurant.example.restaurant.service.notification;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final BlockingQueue<NotificationMessage> queue = new LinkedBlockingQueue<>();
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "notification-dispatcher");
        t.setDaemon(true);
        return t;
    });
    private final SimpMessagingTemplate messagingTemplate;
    private volatile boolean running = true;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void bootstrap() {
        executor.submit(this::dispatchLoop);
    }

    @PreDestroy
    public void shutdown() {
        running = false;
        executor.shutdownNow();
    }

    public void enqueue(NotificationMessage message) {
        if (message == null) {
            return;
        }
        queue.offer(message);
    }

    private void dispatchLoop() {
        while (running && !Thread.currentThread().isInterrupted()) {
            try {
                NotificationMessage message = queue.take();
                sendNow(message);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            } catch (Exception ex) {
                log.error("Failed to dispatch notification", ex);
            }
        }
    }

    private void sendNow(NotificationMessage message) {
        String destination = message.getDestination();
        if (destination == null || destination.isBlank()) {
            destination = "/topic/notifications";
        }
        messagingTemplate.convertAndSend(destination, message.getPayload());
    }
}

