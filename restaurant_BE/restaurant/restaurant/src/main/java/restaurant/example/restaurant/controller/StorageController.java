// package restaurant.example.restaurant.controller;

// import java.io.InputStream;

// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestPart;
// import org.springframework.web.bind.annotation.RestController;
// import org.springframework.web.multipart.MultipartFile;

// import lombok.RequiredArgsConstructor;
// import lombok.RequiredArgsConstructor;
// import org.springframework.http.HttpHeaders;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;
// import org.springframework.web.multipart.MultipartFile;

// import java.io.InputStream;
// import java.util.List;

// public @RestController
// @RequestMapping("/api/v1/storage")
// @RequiredArgsConstructor
// public class StorageController {
// /**
// * Upload files to storage.
// */
// @PostMapping("/upload")
// public ResponseEntity<Void> uploadFile(
// @RequestPart("files") List<MultipartFile> files
// ) {
// storageService.upload(files);
// return ResponseEntity.ok().build();
// }

// private final StorageService storageService;

// /**
// * Download file from storage.
// */
// @GetMapping("/download/{fileName}")
// public ResponseEntity<byte[]> download(
// @PathVariable String fileName
// ) {
// try {
// InputStream stream = storageService.download(fileName);
// byte[] content = stream.readAllBytes();
// return ResponseEntity.ok()
// .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName
// + "\"")
// .body(content);
// } catch (Exception e) {
// return ResponseEntity.internalServerError().body(null);
// }
// }

// /**
// * Get pre-signed URL for accessing a file.
// */
// @GetMapping("/pre-signed-url/{fileName}")
// public ResponseEntity<String> getPreSignedUrl(@PathVariable String fileName)
// {
// return ResponseEntity.ok(storageService.getURL(fileName));
// }
// }{

// }
