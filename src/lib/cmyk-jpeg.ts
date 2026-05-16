const ZIG_ZAG = [
  0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17,
  25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53, 10, 19, 23, 32, 39, 45, 52,
  54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36,
  48, 49, 57, 58, 62, 63,
];

const BASE_QUANT_TABLE = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13,
  16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56,
  68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103,
  121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99,
];

const AAN_SCALE_FACTORS = [
  1.0, 1.387039845, 1.306562965, 1.175875602, 1.0, 0.785694958,
  0.5411961, 0.275899379,
];

const STD_DC_LUMINANCE_BITS = [
  0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
];
const STD_DC_LUMINANCE_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const STD_AC_LUMINANCE_BITS = [
  0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125,
];
const STD_AC_LUMINANCE_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
  0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08,
  0x23, 0x42, 0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0a, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2a, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45,
  0x46, 0x47, 0x48, 0x49, 0x4a, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
  0x5a, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x73, 0x74, 0x75,
  0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0xa2, 0xa3,
  0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6,
  0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
  0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1, 0xe2,
  0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
  0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
];

interface HuffmanCode {
  code: number;
  length: number;
}

interface QuantTables {
  quant: Uint8Array;
  divisors: Float64Array;
}

interface CmykBlocks {
  c: Float64Array;
  m: Float64Array;
  y: Float64Array;
  k: Float64Array;
}

const COMPONENT_IDS = [67, 77, 89, 75];

export function encodeCmykJpeg(
  rgbaData: Uint8ClampedArray,
  width: number,
  height: number,
  quality = 0.9
) {
  if (width <= 0 || height <= 0 || width > 65535 || height > 65535) {
    throw new Error("JPEG dimensions must be between 1 and 65535 pixels.");
  }

  const { quant, divisors } = buildQuantTables(quality);
  const dcTable = buildHuffmanTable(
    STD_DC_LUMINANCE_BITS,
    STD_DC_LUMINANCE_VALUES
  );
  const acTable = buildHuffmanTable(
    STD_AC_LUMINANCE_BITS,
    STD_AC_LUMINANCE_VALUES
  );
  const bytes: number[] = [];

  writeMarker(bytes, 0xd8);
  writeAdobeApp14(bytes);
  writeDqt(bytes, quant);
  writeSof0(bytes, width, height);
  writeDht(bytes, 0, 0, STD_DC_LUMINANCE_BITS, STD_DC_LUMINANCE_VALUES);
  writeDht(bytes, 1, 0, STD_AC_LUMINANCE_BITS, STD_AC_LUMINANCE_VALUES);
  writeSos(bytes);

  const writer = new EntropyWriter(bytes);
  const blocks: CmykBlocks = {
    c: new Float64Array(64),
    m: new Float64Array(64),
    y: new Float64Array(64),
    k: new Float64Array(64),
  };
  const quantized = new Int16Array(64);
  const zigzag = new Int16Array(64);
  const previousDc = [0, 0, 0, 0];

  for (let blockY = 0; blockY < height; blockY += 8) {
    for (let blockX = 0; blockX < width; blockX += 8) {
      fillCmykBlocks(rgbaData, width, height, blockX, blockY, blocks);

      previousDc[0] = writeComponentBlock(
        writer,
        blocks.c,
        divisors,
        quantized,
        zigzag,
        previousDc[0],
        dcTable,
        acTable
      );
      previousDc[1] = writeComponentBlock(
        writer,
        blocks.m,
        divisors,
        quantized,
        zigzag,
        previousDc[1],
        dcTable,
        acTable
      );
      previousDc[2] = writeComponentBlock(
        writer,
        blocks.y,
        divisors,
        quantized,
        zigzag,
        previousDc[2],
        dcTable,
        acTable
      );
      previousDc[3] = writeComponentBlock(
        writer,
        blocks.k,
        divisors,
        quantized,
        zigzag,
        previousDc[3],
        dcTable,
        acTable
      );
    }
  }

  writer.flush();
  writeMarker(bytes, 0xd9);

  return new Uint8Array(bytes);
}

function buildQuantTables(quality: number): QuantTables {
  const normalizedQuality = Math.min(
    100,
    Math.max(1, quality <= 1 ? Math.round(quality * 100) : Math.round(quality))
  );
  const scale =
    normalizedQuality < 50
      ? 5000 / normalizedQuality
      : 200 - normalizedQuality * 2;
  const quant = new Uint8Array(64);
  const divisors = new Float64Array(64);

  for (let i = 0; i < 64; i++) {
    quant[i] = Math.min(
      255,
      Math.max(1, Math.floor((BASE_QUANT_TABLE[i] * scale + 50) / 100))
    );
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const index = row * 8 + col;
      divisors[index] =
        1 / (quant[index] * AAN_SCALE_FACTORS[row] * AAN_SCALE_FACTORS[col] * 8);
    }
  }

  return { quant, divisors };
}

function buildHuffmanTable(bits: number[], values: number[]) {
  const table: Array<HuffmanCode | undefined> = [];
  let code = 0;
  let valueIndex = 0;

  for (let bitLength = 1; bitLength <= 16; bitLength++) {
    const count = bits[bitLength - 1];

    for (let i = 0; i < count; i++) {
      table[values[valueIndex]] = {
        code,
        length: bitLength,
      };
      code += 1;
      valueIndex += 1;
    }

    code <<= 1;
  }

  return table;
}

function fillCmykBlocks(
  rgbaData: Uint8ClampedArray,
  width: number,
  height: number,
  blockX: number,
  blockY: number,
  blocks: CmykBlocks
) {
  let targetIndex = 0;

  for (let y = 0; y < 8; y++) {
    const sourceY = Math.min(blockY + y, height - 1);

    for (let x = 0; x < 8; x++) {
      const sourceX = Math.min(blockX + x, width - 1);
      const sourceIndex = (sourceY * width + sourceX) * 4;
      const red = rgbaData[sourceIndex];
      const green = rgbaData[sourceIndex + 1];
      const blue = rgbaData[sourceIndex + 2];
      const cyanPrime = 255 - red;
      const magentaPrime = 255 - green;
      const yellowPrime = 255 - blue;
      const black = Math.min(cyanPrime, magentaPrime, yellowPrime);
      let cyan = 0;
      let magenta = 0;
      let yellow = 0;

      if (black < 255) {
        const inkRange = 255 - black;
        cyan = ((cyanPrime - black) * 255) / inkRange;
        magenta = ((magentaPrime - black) * 255) / inkRange;
        yellow = ((yellowPrime - black) * 255) / inkRange;
      }

      blocks.c[targetIndex] = 255 - cyan - 128;
      blocks.m[targetIndex] = 255 - magenta - 128;
      blocks.y[targetIndex] = 255 - yellow - 128;
      blocks.k[targetIndex] = 255 - black - 128;
      targetIndex += 1;
    }
  }
}

function writeComponentBlock(
  writer: EntropyWriter,
  block: Float64Array,
  divisors: Float64Array,
  quantized: Int16Array,
  zigzag: Int16Array,
  previousDc: number,
  dcTable: Array<HuffmanCode | undefined>,
  acTable: Array<HuffmanCode | undefined>
) {
  forwardDct(block);

  for (let i = 0; i < 64; i++) {
    quantized[i] = roundToInt(block[i] * divisors[i]);
    zigzag[ZIG_ZAG[i]] = quantized[i];
  }

  const dc = zigzag[0];
  const diff = dc - previousDc;
  const dcCategory = getCategory(diff);

  writeHuffmanCode(writer, dcTable[dcCategory]);

  if (dcCategory > 0) {
    writer.writeBits(getAmplitudeBits(diff, dcCategory), dcCategory);
  }

  let endOfBlock = 63;

  while (endOfBlock > 0 && zigzag[endOfBlock] === 0) {
    endOfBlock -= 1;
  }

  if (endOfBlock === 0) {
    writeHuffmanCode(writer, acTable[0]);

    return dc;
  }

  let zeroRun = 0;

  for (let i = 1; i <= endOfBlock; i++) {
    const value = zigzag[i];

    if (value === 0) {
      zeroRun += 1;
      continue;
    }

    while (zeroRun > 15) {
      writeHuffmanCode(writer, acTable[0xf0]);
      zeroRun -= 16;
    }

    const category = getCategory(value);
    const symbol = zeroRun * 16 + category;

    writeHuffmanCode(writer, acTable[symbol]);
    writer.writeBits(getAmplitudeBits(value, category), category);
    zeroRun = 0;
  }

  if (endOfBlock !== 63) {
    writeHuffmanCode(writer, acTable[0]);
  }

  return dc;
}

function forwardDct(data: Float64Array) {
  let offset = 0;

  for (let row = 0; row < 8; row++) {
    transformVector(
      data[offset],
      data[offset + 1],
      data[offset + 2],
      data[offset + 3],
      data[offset + 4],
      data[offset + 5],
      data[offset + 6],
      data[offset + 7],
      data,
      offset,
      1
    );
    offset += 8;
  }

  for (let col = 0; col < 8; col++) {
    transformVector(
      data[col],
      data[col + 8],
      data[col + 16],
      data[col + 24],
      data[col + 32],
      data[col + 40],
      data[col + 48],
      data[col + 56],
      data,
      col,
      8
    );
  }
}

function transformVector(
  d0: number,
  d1: number,
  d2: number,
  d3: number,
  d4: number,
  d5: number,
  d6: number,
  d7: number,
  target: Float64Array,
  offset: number,
  stride: number
) {
  const tmp0 = d0 + d7;
  const tmp7 = d0 - d7;
  const tmp1 = d1 + d6;
  const tmp6 = d1 - d6;
  const tmp2 = d2 + d5;
  const tmp5 = d2 - d5;
  const tmp3 = d3 + d4;
  const tmp4 = d3 - d4;
  const tmp10 = tmp0 + tmp3;
  const tmp13 = tmp0 - tmp3;
  const tmp11 = tmp1 + tmp2;
  const tmp12 = tmp1 - tmp2;
  const z1 = (tmp12 + tmp13) * 0.707106781;
  const odd10 = tmp4 + tmp5;
  const odd11 = tmp5 + tmp6;
  const odd12 = tmp6 + tmp7;
  const z5 = (odd10 - odd12) * 0.382683433;
  const z2 = 0.5411961 * odd10 + z5;
  const z4 = 1.306562965 * odd12 + z5;
  const z3 = odd11 * 0.707106781;
  const z11 = tmp7 + z3;
  const z13 = tmp7 - z3;

  target[offset] = tmp10 + tmp11;
  target[offset + stride * 4] = tmp10 - tmp11;
  target[offset + stride * 2] = tmp13 + z1;
  target[offset + stride * 6] = tmp13 - z1;
  target[offset + stride * 5] = z13 + z2;
  target[offset + stride * 3] = z13 - z2;
  target[offset + stride] = z11 + z4;
  target[offset + stride * 7] = z11 - z4;
}

function writeHuffmanCode(
  writer: EntropyWriter,
  huffmanCode: HuffmanCode | undefined
) {
  if (!huffmanCode) {
    throw new Error("Missing Huffman code.");
  }

  writer.writeBits(huffmanCode.code, huffmanCode.length);
}

function getCategory(value: number) {
  const absoluteValue = Math.abs(value);

  if (absoluteValue === 0) {
    return 0;
  }

  return Math.floor(Math.log2(absoluteValue)) + 1;
}

function getAmplitudeBits(value: number, category: number) {
  if (value >= 0) {
    return value;
  }

  return value + (1 << category) - 1;
}

function roundToInt(value: number) {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}

function writeAdobeApp14(bytes: number[]) {
  writeSegment(bytes, 0xee, [
    0x41, 0x64, 0x6f, 0x62, 0x65, 0x00, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
}

function writeDqt(bytes: number[], quant: Uint8Array) {
  const payload = [0x00];

  for (let i = 0; i < 64; i++) {
    payload.push(quant[ZIG_ZAG.indexOf(i)]);
  }

  writeSegment(bytes, 0xdb, payload);
}

function writeSof0(bytes: number[], width: number, height: number) {
  const payload = [0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 4];

  for (const componentId of COMPONENT_IDS) {
    payload.push(componentId, 0x11, 0x00);
  }

  writeSegment(bytes, 0xc0, payload);
}

function writeDht(
  bytes: number[],
  tableClass: number,
  tableId: number,
  bits: number[],
  values: number[]
) {
  writeSegment(bytes, 0xc4, [(tableClass << 4) | tableId, ...bits, ...values]);
}

function writeSos(bytes: number[]) {
  const payload = [4];

  for (const componentId of COMPONENT_IDS) {
    payload.push(componentId, 0x00);
  }

  payload.push(0x00, 0x3f, 0x00);
  writeSegment(bytes, 0xda, payload);
}

function writeSegment(bytes: number[], marker: number, payload: number[]) {
  writeMarker(bytes, marker);
  writeUint16(bytes, payload.length + 2);
  bytes.push(...payload);
}

function writeMarker(bytes: number[], marker: number) {
  bytes.push(0xff, marker);
}

function writeUint16(bytes: number[], value: number) {
  bytes.push((value >> 8) & 0xff, value & 0xff);
}

class EntropyWriter {
  private bitBuffer = 0;
  private bitCount = 0;
  private readonly bytes: number[];

  constructor(bytes: number[]) {
    this.bytes = bytes;
  }

  writeBits(value: number, length: number) {
    this.bitBuffer = (this.bitBuffer << length) | value;
    this.bitCount += length;

    while (this.bitCount >= 8) {
      this.bitCount -= 8;
      this.writeEntropyByte((this.bitBuffer >> this.bitCount) & 0xff);
    }
  }

  flush() {
    if (this.bitCount === 0) {
      return;
    }

    const remainingBits = 8 - this.bitCount;
    const byte =
      ((this.bitBuffer << remainingBits) | ((1 << remainingBits) - 1)) & 0xff;

    this.writeEntropyByte(byte);
    this.bitBuffer = 0;
    this.bitCount = 0;
  }

  private writeEntropyByte(value: number) {
    this.bytes.push(value);

    if (value === 0xff) {
      this.bytes.push(0x00);
    }
  }
}
