package com.almirobe.speech;

import com.almirobe.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/speech")
public class SpeechController {

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public void transcribe(
            @RequestPart("audio") MultipartFile audio, @RequestParam("locale") String locale
    ) {
        if (audio == null || locale == null) {
            throw new ApiException("VALIDATION_ERROR", "audio and locale are required", HttpStatus.BAD_REQUEST);
        }
        throw new ApiException(
                "SPEECH_UNAVAILABLE",
                "Server speech fallback is not enabled. Use browser speech for en-IN, hi-IN, bn-IN, kn-IN.",
                HttpStatus.NOT_IMPLEMENTED);
    }
}
