importScripts('LZWEncoder.min.js', 'NeuQuant.min.js', 'GIFEncoder.min.js');

self.onmessage = function(event) {
    var
    frame_index = event.data["frame_index"],
    frame_length = event.data["frame_length"],
    height = event.data["height"], 
    width = event.data["width"],
    delay = event.data["delay"],
    imageData = event.data["imageData"];

    var encoder = new GIFEncoder(); //create a new GIFEncoder for every new job
    encoder.setRepeat(0); //0  -> loop forever
    encoder.setQuality(1);
    encoder.setSize(width, height); 
    encoder.setDelay(delay); //go to next frame every n milliseconds

    if (frame_index === 0) {
        encoder.start();
    } else {
        encoder.cont();
        encoder.setProperties(true, false); //started, firstFrame
    }

    encoder.addFrame(imageData, true);

    if (frame_length === frame_index) {
        encoder.finish();
    }

    self.postMessage({
        "frame_index":frame_index,
        "frame_data":encoder.stream().getData()
    });
};
