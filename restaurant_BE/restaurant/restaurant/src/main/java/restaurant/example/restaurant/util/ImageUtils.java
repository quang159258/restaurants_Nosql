package restaurant.example.restaurant.util;

public final class ImageUtils {

    private ImageUtils() {
    }

    public static String extractPrimaryImage(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return trimmed;
        }
        if (isJsonArray(trimmed)) {
            String content = trimmed.substring(1, trimmed.length() - 1); // remove [ ]
            String[] parts = content.split(",");
            if (parts.length > 0) {
                return stripQuotes(parts[0].trim());
            }
        }
        return stripQuotes(trimmed);
    }

    private static boolean isJsonArray(String value) {
        return value.startsWith("[") && value.endsWith("]");
    }

    private static String stripQuotes(String value) {
        if (value == null) {
            return null;
        }
        String stripped = value;
        if (stripped.startsWith("\"") && stripped.endsWith("\"") && stripped.length() >= 2) {
            stripped = stripped.substring(1, stripped.length() - 1);
        }
        stripped = stripped.trim();
        return stripped;
    }
}

