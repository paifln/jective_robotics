export function validatePrintLabel(label:string){if(typeof label!=='string'||label.length>1000||label.includes('\0'))throw new Error('TEXT_RANGE');}
/** Six decimal places, rounded half away from zero; suppress negative rounded zero. */
export function formatPrintedValue(label:string,value:number){
 validatePrintLabel(label);if(!Number.isFinite(value)||Math.abs(value)>1e9)throw new Error('PRINT_VALUE_RANGE');
 const rounded=Math.floor(Math.abs(value)*1e6+.5);return label+(value<0&&rounded!==0?'-':'')+Math.floor(rounded/1e6)+'.'+String(rounded%1e6).padStart(6,'0');
}
export const printValueCPP=`bool j_print_value(const char* label, double value) {
  if (j_expression_error) return false;
  if (!isfinite(value) || fabs(value) > 1000000000.0) { j_expression_fault("PRINT_VALUE_RANGE"); return false; }
  const uint64_t rounded = static_cast<uint64_t>(floor(fabs(value) * 1000000.0 + 0.5));
  Serial.print(label);
  if (value < 0 && rounded != 0) Serial.write(static_cast<uint8_t>('-'));
  Serial.print(static_cast<unsigned long>(rounded / 1000000ULL));
  Serial.write(static_cast<uint8_t>('.'));
  const uint32_t fraction = static_cast<uint32_t>(rounded % 1000000ULL);
  for (uint32_t divisor = 100000; divisor > 0; divisor /= 10) Serial.write(static_cast<uint8_t>('0' + (fraction / divisor) % 10));
  Serial.println();
  return true;
}
`;
