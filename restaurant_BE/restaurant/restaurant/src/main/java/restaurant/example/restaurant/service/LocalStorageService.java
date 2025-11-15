package restaurant.example.restaurant.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@Profile("!minio")
public class LocalStorageService implements StorageService {

    private final Path storageRoot;

    public LocalStorageService(@Value("${storage.local.base-dir:uploads}") String baseDir) {
        this.storageRoot = Paths.get(baseDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.storageRoot);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot initialize storage directory: " + this.storageRoot, e);
        }
    }

    @Override
    public void upload(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return;
        }
        for (MultipartFile file : files) {
            uploadSingleFile(file);
        }
    }

    @Override
    public String uploadSingleFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalName.substring(dotIndex);
        }
        String safeBaseName = originalName.substring(0, dotIndex >= 0 ? dotIndex : originalName.length())
                .replaceAll("[^a-zA-Z0-9-_]", "_");
        String finalName = String.format("%s-%s%s", safeBaseName.isBlank() ? "file" : safeBaseName,
                Instant.now().toEpochMilli(), extension);

        Path target = this.storageRoot.resolve(finalName).normalize();
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + finalName, e);
        }
        return finalName;
    }

    @Override
    public InputStream download(String fileName) {
        try {
            Path filePath = this.storageRoot.resolve(fileName).normalize();
            if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
                throw new RuntimeException("File not found: " + fileName);
            }
            return Files.newInputStream(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file " + fileName, e);
        }
    }

    @Override
    public String getURL(String fileName) {
        return "/images/" + fileName;
    }
}

