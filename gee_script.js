/**
 * Title: Land Use Land Cover Classification of Delhi NCR
 * Description: A script to classify Sentinel-2 imagery for the Delhi NCR region
 * into four classes: Water, Vegetation, Built-up, and Barren Land.
 * Author: Supreet Sarita Das (Adapted for public use)
 * Date: 2025-08-16
 */

// ==================================================================================
// IMPORTANT USER INSTRUCTION
// ==================================================================================
// Before running this script, you MUST create your own training polygons.
// 1. Use the geometry drawing tools on the left of the map interface.
// 2. Draw several polygons for each of the four land cover classes.
// 3. After creating a new geometry layer, click the settings icon next to its name
//    in the "Imports" section at the top of the script.
// 4. RENAME the layers to exactly match these names:
//    - waterGeom
//    - vegGeom
//    - builtGeom
//    - barrenGeom
//
// The script will not work without these user-defined geometries.
// ==================================================================================

// ===== 1. Define Area of Interest (AOI) for Delhi NCR =====
var aoi = ee.Geometry.Polygon([[
  [76.8402, 28.2506],
  [77.6785, 28.2506],
  [77.6785, 28.9845],
  [76.8402, 28.9845]
]]);
Map.centerObject(aoi, 10);

// ===== 2. Load and Filter Sentinel-2 Data =====
var start_date = '2023-11-01';
var end_date = '2023-11-30';

// Function to mask clouds using the Sentinel-2 QA band
function maskS2clouds(image) {
  var qa = image.select('SCL');
  // Bits 3, 8, 9, 10 are cloud shadow, cloud, cloud high probability, and cirrus
  var cloudMask = qa.neq(3).and(qa.neq(8)).and(qa.neq(9)).and(qa.neq(10));
  return image.updateMask(cloudMask);
}

var s2_collection = ee.ImageCollection("COPERNICUS/S2_SR")
  .filterBounds(aoi)
  .filterDate(start_date, end_date)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
  .map(maskS2clouds);

// Create a median composite image
var s2_composite = s2_collection.median().clip(aoi);

// Visualization parameters for RGB
var rgb_vis_params = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};
Map.addLayer(s2_composite, rgb_vis_params, 'Sentinel-2 RGB Composite');

// ===== 3. Derive NDVI and NDWI Indices =====
var ndvi = s2_composite.normalizedDifference(['B8', 'B4']).rename('NDVI');
var ndwi = s2_composite.normalizedDifference(['B3', 'B8']).rename('NDWI');

// Add indices to the composite image
var image_with_indices = s2_composite.addBands([ndvi, ndwi]);
var bands = ['B2', 'B3', 'B4', 'B8', 'NDVI', 'NDWI'];

// ===== 4. Prepare Training Data =====
// Merge the user-drawn geometries into a single FeatureCollection.
// The 'landcover' property is the class label (0, 1, 2, 3).
var training_polygons = ee.FeatureCollection([
  waterGeom.map(function(f) { return f.set('landcover', 0); }),
  vegGeom.map(function(f) { return f.set('landcover', 1); }),
  builtGeom.map(function(f) { return f.set('landcover', 2); }),
  barrenGeom.map(function(f) { return f.set('landcover', 3); })
]).flatten();

// Sample pixels from within the training polygons.
var training_data = image_with_indices.select(bands).sampleRegions({
  collection: training_polygons,
  properties: ['landcover'],
  scale: 10,
  geometries: true
});

// Add a random column for train/test splitting
training_data = training_data.randomColumn('rand');

// ===== 5. Train/Test Split =====
var train_set = training_data.filter(ee.Filter.lt('rand', 0.7));
var test_set = training_data.filter(ee.Filter.gte('rand', 0.7));
print('Total Samples:', training_data.size());
print('Training Size:', train_set.size(), 'Test Size:', test_set.size());

// ===== 6. Train Random Forest Classifier =====
var classifier = ee.Classifier.smileRandomForest(200).train({
  features: train_set,
  classProperty: 'landcover',
  inputProperties: bands
});

// ===== 7. Classify the Image =====
var classified_image = image_with_indices.classify(classifier);

// Visualization palette for the LULC map
var lulc_palette = [
  '#0000FF', // Water (blue)
  '#008000', // Vegetation (green)
  '#808080', // Built-up (gray)
  '#A52A2A'  // Barren Land (brown)
];
Map.addLayer(classified_image, {min: 0, max: 3, palette: lulc_palette}, 'LULC Map');

// ===== 8. Accuracy Assessment =====
var validated = test_set.classify(classifier);
var confusion_matrix = validated.errorMatrix('landcover', 'classification');

print('Confusion Matrix (test):', confusion_matrix);
print('Overall Accuracy (test):', confusion_matrix.accuracy());
print('Kappa Coefficient:', confusion_matrix.kappa());

// ===== 9. Export the Classified Map =====
Export.image.toDrive({
  image: classified_image.toByte(),
  description: 'Delhi_NCR_LULC_Map',
  folder: 'GEE_Exports',
  scale: 10,
  region: aoi,
  maxPixels: 1e13
});
