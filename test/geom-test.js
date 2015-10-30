var assert = require('assert'),
    mapshaper = require("../"),
    geom = mapshaper.geom;

function equalAngles(a, b) {
  if (Math.abs(a - b) < 1e-10) {
    assert(true);
  } else {
    assert.equal(a, b);
  }
}

function aboutEqual(a, b) {
  var d = Math.abs(a - b);
  if (isNaN(d) || d > 1e-12) {
    assert.equal(a, b);
  }
}

function equalBearings(a, b) {
  equalAngles(geom.standardAngle(a), geom.standardAngle(b));
}

describe("mapshaper-geom.js", function() {

  describe('standardAngle()', function() {
    it('wraps', function() {
      equalAngles(geom.standardAngle(-Math.PI), Math.PI);
      equalAngles(geom.standardAngle(-3 * Math.PI), Math.PI);
      equalAngles(geom.standardAngle(3 * Math.PI), Math.PI);
      equalAngles(geom.standardAngle(2 * Math.PI), 0);
      equalAngles(geom.standardAngle(4 * Math.PI), 0);
    })
  })

  describe('bearing()', function () {
    it('bearing to north pole is 0', function () {
      equalBearings(geom.bearing(90, 0, 90, 90), 0)
      equalBearings(geom.bearing(90, 70, 20, 90), 0)
    })

    it('bearing to s pole is PI', function () {
      equalBearings(geom.bearing(90, 0, 90, -90), Math.PI)
      equalBearings(geom.bearing(90, 70, 20, -90), Math.PI)
    })
  })

  describe('sphericalDistance()', function () {
    var PI = Math.PI,
        halfPI = PI / 2;
    it('antipodal distance is PI', function () {
      aboutEqual(geom.sphericalDistance(0, PI/2, 0, -PI/2), PI);
      aboutEqual(geom.sphericalDistance(-PI, PI/2, PI, -PI/2), PI);
      aboutEqual(geom.sphericalDistance(-PI, 0, 0, 0), PI);
      aboutEqual(geom.sphericalDistance(0, 0, PI, 0), PI);
      aboutEqual(geom.sphericalDistance(0, 0, -PI, 0), PI);
      aboutEqual(geom.sphericalDistance(PI/2, PI/4, -PI/2, -PI/4), PI);
    })

    it('quarter arc distance is half PI', function() {
        aboutEqual(geom.sphericalDistance(0, PI/2, 0, 0), halfPI);
        aboutEqual(geom.sphericalDistance(0, 0, PI/2, 0), halfPI);
    })
  })

  describe('signedAngleSph()', function () {
    it('bend at equator', function () {
      equalAngles(geom.signedAngleSph(0, 0, 90, 0, 180, 0), geom.signedAngle(0, 0, 90, 0, 180, 0));
      equalAngles(geom.signedAngleSph(0, 0, -90, 0, -180, 0), geom.signedAngle(0, 0, -90, 0, -180, 0));
      equalAngles(geom.signedAngleSph(10, 0, 90, 0, 90, 10), geom.signedAngle(10, 0, 90, 0, 90, 10));
      equalAngles(geom.signedAngleSph(90, -10, 90, 0, 10, 0), geom.signedAngle(90, -10, 90, 0, 10, 0));
      equalAngles(geom.signedAngleSph(10, 0, 90, 0, 90, -10), geom.signedAngle(10, 0, 90, 0, 90, -10));
      equalAngles(geom.signedAngleSph(90, -10, 90, 0, 110, 0), geom.signedAngle(90, -10, 90, 0, 110, 0));
    });

    it('bend at north pole', function() {
      equalAngles(geom.signedAngleSph(0, 0, 0, 90, 90, 0), Math.PI/2); // right bend
      equalAngles(geom.signedAngleSph(0, 0, 0, 90, -90, 0), 1.5 * Math.PI); // left bend
    });

  });


  describe('getRoundingFunction', function () {

    function testAtPrecision(precision) {
      var round = geom.getRoundingFunction(precision),
          // avoid 0.0000001 -> 1e-7
          maxDigits = countDigits(precision.toFixed(15).replace(/0*$/, '')),
          tests = 1000,
          num, rounded, str;

      while (tests--) {
        num = Math.random() * 2 - 1;
        num *= Math.pow(10, Math.floor(Math.random() * 10));// better distribution
        rounded = round(num);
        str = JSON.stringify(rounded);
        assert.ok(countDigits(str) <= maxDigits, num + " -> " + str);
      }

    }

    function countDigits(str) {
      var idx = str.indexOf('.');
      var digits = idx > 0 ? str.length - idx - 1 : 0;
      return digits;
    }

    it('Rounds to 1s', function () {
      var round = geom.getRoundingFunction(1);
      assert.equal(round(10.2), 10);
      assert.equal(round(-1000000.2), -1000000);
    })

    it('Rounds to 10s', function () {
      var round = geom.getRoundingFunction(10);
      assert.equal(round(11), 10);
      assert.equal(round(-15.55), -20);
    })

    it('Rounds to 0.01', function () {
      testAtPrecision(0.01)
    })

    it('Rounds to 0.0001', function () {
      testAtPrecision(0.0001)
    })

    it('Rounds to 0.001', function () {
      testAtPrecision(0.001)
    })

    it('Rounds to 0.1', function () {
      testAtPrecision(0.1)
    })

    it('Rounds to 0.00001', function () {
      testAtPrecision(0.00001)
    })

    it('Rounds to 0.000001', function () {
      testAtPrecision(0.000001)
    })

    it('Rounds to 0.0000001', function () {
      testAtPrecision(0.0000001);
    })

    it('Rounds to 0.00000001', function () {
      testAtPrecision(0.00000001);
    })

    it('JSON.stringify() doesn\'t show rounding artefacts', function () {
      var round = geom.getRoundingFunction(0.1);
      assert.equal(JSON.stringify(round(0.1)), "0.1");
      assert.equal(JSON.stringify(round(-77.2)), "-77.2");
      assert.equal(JSON.stringify(round(33.3)), "33.3");
      assert.equal(JSON.stringify(round(-33330.4)), "-33330.4");
      assert.equal(JSON.stringify(round(77.5)), "77.5");
      assert.equal(JSON.stringify(round(899222.6)), "899222.6");
      assert.equal(JSON.stringify(round(1000000.7)), "1000000.7");
      assert.equal(JSON.stringify(round(-1000000.8)), "-1000000.8");
      assert.equal(JSON.stringify(round(1000000.9)), "1000000.9");
   })
  })

  describe('segmentIntersection', function () {
    it('Joined segs are hits', function () {
      assert.equal(!!geom.segmentIntersection(0, 0, 0, 1, 0, 1, 1, 1), true)
      assert.equal(!!geom.segmentIntersection(0, 0, 0, 1, 1, 0, 0, 0), true)
      assert.equal(!!geom.segmentIntersection(0, 0, 0, 1, 0, 0, 1, 0), true)
      assert.equal(!!geom.segmentIntersection(0, 0, 1, 1, 1, 1, 2, 0), true)
      assert.equal(!!geom.segmentIntersection(0, 0, 1, -1, 1, -1, 2, 0), true)
    });

    it('Congruent segments are false', function() {
      assert.equal(geom.segmentIntersection(0, 0, 1, 1, 0, 0, 1, 1), false)
      assert.equal(geom.segmentIntersection(1, 1, 0, 0, 0, 0, 1, 1), false)
    })

    it('Partially congruent segments are false', function() {
      assert.equal(geom.segmentIntersection(0, 0, 1, 1, 0, 0, 2, 2), false)
      assert.equal(geom.segmentIntersection(2, 2, 0, 0, 0, 0, 1, 1), false)
    })

    it('Tiny overlaps are detected', function() {
      var TINY = 0.00000000001;
      assert.equal(!!geom.segmentIntersection(0, 0, 1, 1, TINY, 0, 1 - TINY, 1), true);
      assert.equal(!!geom.segmentIntersection(TINY, 0, 1, 1, 0, 0, 1, TINY), true);
      assert.equal(!!geom.segmentIntersection(0, 0, 1, -1, TINY, 0, 1 - TINY, -1), true);
      assert.equal(!!geom.segmentIntersection(TINY, 0, 1, -1, 0, 0, 1, -TINY), true);
    })
  })

  describe('signedAngle()', function () {
    it("45 deg", function() {
      assert.equal(geom.signedAngle(1, 0, 0, 0, 2, 2), Math.PI / 4);
    })

    it("135 deg", function() {
      assert.equal(geom.signedAngle(1, 0, 0, 0, -2, 2), 3 * Math.PI / 4);
    })

    it("225 deg", function() {
      assert.equal(geom.signedAngle(1, 0, 0, 0, -2, -2), 5 * Math.PI / 4);
    })

    it("315 deg", function() {
      assert.equal(geom.signedAngle(1, 0, 0, 0, 2, -2), 7 * Math.PI / 4);
    })

    it("returns π if points form a line", function() {
      assert.equal(geom.signedAngle(0, 0, 0, 1, 0, 2), Math.PI);
      assert.equal(geom.signedAngle(-1, 0, 0, 0, 1, 0), Math.PI);
      assert.equal(geom.signedAngle(1, 2, 2, 3, 3, 4), Math.PI);
    })

    it("returns 0 if second segment doubles back", function() {
      assert.equal(geom.signedAngle(0, 0, 0, 1, 0, -2), 0);
      assert.equal(geom.signedAngle(1, 0, 0, -1, 2, 1), 0);
    })

    it("returns π/2 if abc bends right 90deg", function() {
      assert.equal(geom.signedAngle(-1, 0, -1, 2, 3, 2), Math.PI/2);
    })

    it("returns 3π/2 if abc bends left 90deg", function() {
      assert.equal(geom.signedAngle(1, 0, 1, 1, 0, 1), 3 * Math.PI/2);
    })

    it("returns NaN if two adjacent points are the same", function() {
      assert.ok(isNaN(geom.signedAngle(3, 0, 3, 0, 4, 1)));
      assert.ok(isNaN(geom.signedAngle(3, 1, 2, 0, 2, 0)));
    })

    it("returns NaN if all points are the same", function() {
      assert.ok(isNaN(geom.signedAngle(0, -1, 0, -1, 0, -1)));
    })

    it("returns NaN if one or more args are NaN", function() {
      assert.ok(isNaN(geom.signedAngle(0, -1, 0, -1, 0)));
      assert.ok(isNaN(geom.signedAngle()));
      // null gets coerced to zero... need to check for null if NaN is important here
      // assert.ok(isNaN(geom.signedAngle(0, -1, null, -1, 0, -1)));
    })

  })

  describe("innerAngle()", function() {

    it("returns π if points form a line", function() {
      assert.equal(geom.innerAngle(0, 0, 0, 1, 0, 2), Math.PI);
      assert.equal(geom.innerAngle(-1, 0, 0, 0, 1, 0), Math.PI);
      assert.equal(geom.innerAngle(1, 2, 2, 3, 3, 4), Math.PI);
    })

    it("returns 0 if second segment doubles back", function() {
      assert.equal(geom.innerAngle(0, 0, 0, 1, 0, -2), 0);
      assert.equal(geom.innerAngle(1, 0, 0, -1, 2, 1), 0);
    })

    it("returns π/2 if abc bends right 90deg", function() {
      assert.equal(geom.innerAngle(-1, 0, -1, 2, 3, 2), Math.PI/2);
    })

    it("returns π/2 if abc bends left 90deg", function() {
      assert.equal(geom.innerAngle(1, 0, 1, 1, 0, 1), Math.PI/2);
    })

    it("returns 0 if two adjacent points are the same", function() {
      assert.equal(geom.innerAngle(3, 0, 3, 0, 4, 1), 0);
      assert.equal(geom.innerAngle(3, 1, 2, 0, 2, 0), 0);
    })

    it("returns 0 if all points are the same", function() {
      assert.equal(geom.innerAngle(0, -1, 0, -1, 0, -1), 0);
    })

  })


  describe("triangleArea()", function() {

    it("returns correct area if points form a CW triangle", function() {
      assert.equal(geom.triangleArea(1, 3, 4, 1, 1, 1), 3);
    })

    it("returns correct area if points form a CCW triangle", function() {
      assert.equal(geom.triangleArea(1, 1, 4, 1, 1, 3), 3);
    })

    it("returns 0 if triangle has collapsed", function() {
      assert.equal(geom.triangleArea(1, 1, 1, 1, 2, 3), 0)
      assert.equal(geom.triangleArea(1, 1, 2, 3, 1, 1), 0)
      assert.equal(geom.triangleArea(2, 3, 1, 1, 1, 1), 0)
      assert.equal(geom.triangleArea(1, 1, 1, 1, 1, 1), 0)
   })

  })

})
