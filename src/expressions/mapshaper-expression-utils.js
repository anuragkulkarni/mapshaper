import utils from '../utils/mapshaper-utils';
import { blend } from '../color/blending';

export default {
  round: function(val, dig) {
    var k = 1;
    dig = dig | 0;
    while(dig-- > 0) k *= 10;
    return Math.round(val * k) / k;
  },
  sprintf: utils.format,
  blend: blend
};
