export default function getHelper({
  CrossSection,
  cv
}) {

  function getShapesFromCntAndHierarchy(contours, hierarchy, sizeOfPerPix=1) {
    const rawHierarchyData = hierarchy.data32S
    const shapeDict = {}
    const holesDict = {}
    for (let i = 0; i < rawHierarchyData.length; i += 4) {
      const data = ({
        next: rawHierarchyData[i],
        prev: rawHierarchyData[i + 1],
        child: rawHierarchyData[i + 2],
        parent: rawHierarchyData[i + 3],
        now: i / 4
      })

      if (data.parent === -1) {
        shapeDict[i / 4] = data
      } else {
        if (holesDict[data.parent]) {
          holesDict[data.parent].push(data)
        } else {
          holesDict[data.parent] = [data]
        }
      }
    }

    function getPointsFromIndex(index) {
      const cnt = contours.get(index);
      const rawPointData = cnt.data32S
      const points = []

      let step = 2
      for (let i = 0; i < rawPointData.length; i += step) {
        points.push([rawPointData[i] * sizeOfPerPix, rawPointData[i + 1] * sizeOfPerPix])
      }

      return points
    }

    let shapes = []
    for (const key in shapeDict) {
      const shape = shapeDict[key]
      const points = getPointsFromIndex(+key)
      const holes = holesDict[key] ? holesDict[key].map(hole => getPointsFromIndex(hole.now)) : []
      shapes.push({
        points,
        holes: holes.filter(hole => hole.length > 2)
      })
    }
    shapes = shapes.filter(shape => shape.points.length > 2)

    return shapes
  }
  function getCrossSectionFromShape(shape) {
    let poly = CrossSection.ofPolygons([shape.points.reverse()])
    poly = poly.simplify(0.05)
    for (const hole of shape.holes) {
      poly = poly.subtract(CrossSection.ofPolygons(hole))
    }

    return poly
  }

  function getCrossSectionFromShapes(shapes) {
    if (shapes.length === 0) {
      return CrossSection.ofPolygons([])
    }

    const polys = shapes.map(shape => getCrossSectionFromShape(shape))
    const poly = polys.reduce((acc, cur) => acc.add(cur))
    return poly
  }


  function imageDataToCrossSection(imageData: ImageData, threshold=128, sizeOfPerPix=1) {
    // assume imageData is RGBA
    const src = cv.matFromArray(imageData.height, imageData.width, cv.CV_8UC4, imageData.data);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(src, src, threshold, 255, cv.THRESH_BINARY);

    cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE)

    const poly = getCrossSectionFromShapes(getShapesFromCntAndHierarchy(contours, hierarchy, sizeOfPerPix))

    src.delete()
    contours.delete()
    hierarchy.delete()

    return poly
  }



  return {
    getShapesFromCntAndHierarchy,
    getCrossSectionFromShape,
    getCrossSectionFromShapes,
    
    imageDataToCrossSection,
  }
}