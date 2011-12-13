/* Pretty literal C translation of:
 *   http://folklore.org/projects/Macintosh/more/BootBeep.txt
 *
 * For more info, see:
 *   http://folklore.org/StoryView.py?story=Boot_Beep.txt
 *
 * This outputs a WAV file to stdout, so simply redirect the output to a file
 * named e.g. "beep.wav". You can change the duration (given by the number of
 * iterations) and the sample rate (this will change both pitch and duration.)
 * The original hardware could do an 8-bit sample every 44ms, for a rate of
 * about 22,727Hz but 22,050 is probably more practical for current audio
 * devices.
 *
 * Julien Quint <pom@romulusetrem.us> 2011-12-13
 *
 */

#include <stdio.h>
#include <stdint.h>

#define ITERATIONS 40      /* number of iterations of the filtering */
#define SAMPLE_RATE 22050  /* sample rate in Hz */

/* Macros to print 32 and 16 bit integers in little endian order */
#define PRINT32(n) printf("%c%c%c%c", (n) & 0xff, ((n) >> 8) & 0xff, \
    ((n) >> 16) & 0xff, ((n) >> 24) & 0xff);
#define PRINT16(n) printf("%c%c", (n) & 0xff, ((n) >> 8) & 0xff)

int main(int argc, char *argv[])
{
  uint8_t buffer[74 * 5];                         /* buffer for one iteration */
  uint8_t table[4] = { 0x06, 0xc0, 0x40, 0xfa };  /* original sample table */

  /* Print out the RIFF/WAVE headers */
  /* Cf. https://ccrma.stanford.edu/courses/422/projects/WaveFormat/ */
  printf("RIFF");                  /* RIFF header */
  PRINT32(36 + 370 * ITERATIONS);  /* Chunk size */
  printf("WAVE");
  printf("fmt ");                  /* fmt subchunk */
  PRINT32(16);                     /* PCM */
  PRINT16(1);                      /* Linear quantization */
  PRINT16(1);                      /* Mono */
  PRINT32(SAMPLE_RATE);            /* Sample rate */
  PRINT32(SAMPLE_RATE);            /* Byte rate (8-bit samples, mono) */
  PRINT16(1);                      /* Block align (1 byte) */
  PRINT16(8);                      /* Bits per sample */
  printf("data");                  /* data subchunk */
  PRINT32(370 * ITERATIONS);       /* subchunk size */

  /* Fill up the buffer with the original wave form */
  int i, j, k;
  uint8_t *bp = buffer;
  for (i = 0; i < 5; ++i) {
    for (j = 0; j < 4; ++j) {
      for (k = 0; k < 19; ++k) (*bp++) = table[j];
    }
  }

  /* Output the samples for each iteration of the filtering */
  for (i = 0; i < ITERATIONS; ++i) {
    bp = buffer;
    for (j = 0; j < 74; ++j) {
      uint16_t acc = (uint16_t)(bp[73]) + 2 * (uint16_t)(bp[74]) +
        (uint16_t)(bp[75]);
      (*bp++) = (uint8_t)(acc / 4);
    }
    for (j = 74; j < 370; ++j) buffer[j] = buffer[j - 74];
    for (j = 0; j < 370; ++j) printf("%c", buffer[j]);
  }
  return 0;
}
