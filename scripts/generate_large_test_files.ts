import fs from 'fs';

function generateFile(path, sizeInMB) {
    const size = sizeInMB * 1024 * 1024;
    const buffer = Buffer.alloc(size);
    // Write PNG header to make it look slightly more like a PNG
    buffer.write('\x89PNG\r\n\x1a\n', 0, 8);
    // Add some random bits to avoid compression if the platform does it
    for (let i = 8; i < 100; i++) buffer[i] = Math.floor(Math.random() * 256);
    fs.writeFileSync(path, buffer);
    console.log(`Generated ${path} (${sizeInMB}MB)`);
}

generateFile('dummy_6mb.png', 6);
generateFile('dummy_9mb.png', 9);
