package restaurant.example.restaurant.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import restaurant.example.restaurant.service.StorageService;
import restaurant.example.restaurant.util.anotation.ApiMessage;

import java.io.InputStream;
import java.net.URLConnection;

@RestController
public class FileController {
    private final StorageService storageService;

    public FileController(StorageService storageService) {
        this.storageService = storageService;
    }

    // @PostMapping("/files")
    // @ApiMessage("upload single file")
    // public ResponseEntity<ResUploadFileDTO> upload(@RequestParam(name = "file",
    // required = false) MultipartFile file,
    // @RequestParam("folder") String folder) throws URISyntaxException,
    // IOException, StorageException {
    // // check validation
    // if (file == null || file.isEmpty()) {
    // throw new StorageException("File empty , please upload file");
    // }

    // String fileName = file.getOriginalFilename();
    // List<String> allowedExtensions = Arrays.asList("pdf", "jpg", "jpeg", "png",
    // "doc", "docx");
    // boolean isValid = allowedExtensions.stream().anyMatch(item ->
    // fileName.toLowerCase().endsWith(item));

    // if (isValid == false) {
    // throw new StorageException("invalid file extension. only allows " +
    // allowedExtensions.toString());
    // }

    // // create a directory if not exit
    // this.fileService.createDirectory(baseURI + folder);

    // // store file
    // String uploadFile = this.fileService.store(file, folder);
    // ResUploadFileDTO res = new ResUploadFileDTO(uploadFile, Instant.now());
    // return ResponseEntity.ok().body(res);
    // }

    // @GetMapping("/files")
    // @ApiMessage("Download a file")
    // public ResponseEntity<Resource> download(
    // @RequestParam(name = "fileName", required = false) String fileName,
    // @RequestParam(name = "folder", required = false) String folder)
    // throws StorageException, URISyntaxException, FileNotFoundException {
    // if (fileName == null || folder == null) {
    // throw new StorageException("Missing required params : (fileName or folder) in
    // query params.");
    // }
    // // check file exist (and not a directory)
    // long fileLength = this.fileService.getFileLength(fileName, folder);
    // if (fileLength == 0) {
    // throw new StorageException("File with name = " + fileName + " not found.");
    // }
    // // download a file
    // InputStreamResource resource = this.fileService.getResource(fileName,
    // folder);
    // return ResponseEntity.ok()
    // .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName
    // + "\"")
    // .contentLength(fileLength)
    // .contentType(MediaType.APPLICATION_OCTET_STREAM)
    // .body(resource);
    // }

    @PostMapping("/files")
    @ApiMessage("upload single file")
    public ResponseEntity<String> uploadFile(
            @RequestPart("files") MultipartFile files) {
        String fileName = storageService.uploadSingleFile(files);
        return ResponseEntity.status(HttpStatus.OK).body(fileName);
    }

    @GetMapping("/files/{fileName}")
    @ApiMessage("Download a file")
    public ResponseEntity<byte[]> download(@PathVariable String fileName) {
        try (InputStream stream = storageService.download(fileName)) {
            byte[] content = stream.readAllBytes();
            MediaType mediaType = resolveMediaType(fileName);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(mediaType)
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/images/{fileName}")
    @ApiMessage("Get image file")
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) {
        try (InputStream stream = storageService.download(fileName)) {
            byte[] content = stream.readAllBytes();
            MediaType mediaType = resolveMediaType(fileName);
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    private MediaType resolveMediaType(String fileName) {
        String contentType = URLConnection.guessContentTypeFromName(fileName);
        if (contentType == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
