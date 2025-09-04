# LULC_ISA
A simple classfication script for different types of regions across the Delhi_NCR area

## Land Use Land Cover (LULC) Classification of Delhi NCR
Project Overview
This repository contains a Google Earth Engine (GEE) script for performing a Land Use Land Cover (LULC) classification of the Delhi National Capital Region (NCR), India. The project uses Sentinel-2 satellite imagery and a supervised Random Forest machine learning algorithm to classify the landscape into four primary categories:
1. Water Bodies

2. Vegetation

3. Built-up Areas

4. Barren Land

The objective is to generate a spatially accurate LULC map, calculate area statistics for each class, and assess the classification accuracy. This work is based on the report "Generating Land Use Land Cover Map using Supervised Classification Techniques" by Supreet Sarita Das.

## Study Area
The Delhi National Capital Region (NCR) is a major metropolitan area in India. Rapid urbanization and population growth have led to significant transformations in its landscape, with agricultural lands, forests, and water bodies being converted into residential, commercial, and industrial areas. This makes the NCR a critical region for LULC studies to monitor environmental impacts and support sustainable urban planning.

## Data and Methodology
Data Used: 
1. Satellite Imagery: Sentinel-2 SR (Surface Reflectance)
    Provider: Copernicus / ESA (via Google Earth Engine)

2. Date Range: November 1, 2023 – November 30, 2023

3. Key Bands: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR)

4. Derived Indices: NDVI (Normalized Difference Vegetation Index) and NDWI (Normalized Difference Water Index)

## Methodology
The classification process follows these steps within Google Earth Engine:

1. Define Area of Interest (AOI): A polygon is defined to bound the Delhi NCR region.

2. Image Preprocessing: Sentinel-2 imagery is filtered by date and cloud cover (<10%). A median composite is created for the time range.

3. Feature Enhancement: NDVI and NDWI indices are calculated to better distinguish vegetation and water.

4. Training Data Collection: Polygons are manually drawn for each of the four land cover classes to create training samples.

5. Classifier Training: A Random Forest classifier with 200 trees is trained using the spectral bands, derived indices, and the collected training data.

6. Image Classification: The trained model is applied to the entire Sentinel-2 composite image for the AOI.

7. Accuracy Assessment: The dataset is split (70% training, 30% testing) to evaluate the model. A confusion matrix is generated to calculate Overall Accuracy and the Kappa coefficient.

## How to Use the Script
The classification is performed entirely within Google Earth Engine.

1. Access Google Earth Engine: Log in to the GEE Code Editor.

2. Copy Script: Copy the entire content of the gee_script.js file from this repository and paste it into the GEE Code Editor.

3. Draw Training Polygons: Before running the script, you must create your own training data. Use the geometry drawing tools on the left side of the map to create polygons for each land cover class. Make sure to rename the new geometry layers to waterGeom, vegGeom, builtGeom, and barrenGeom to match the script.

4. Run Script: Click the "Run" button at the top of the editor.

5. View Results: The classified LULC map will be displayed in the map panel. Accuracy metrics and the confusion matrix will be printed in the "Console" tab on the right. The script is also configured to export the final map as a GeoTIFF file to your Google Drive.

6. Results and Discussion
The classification achieved an Overall Accuracy of 71.9%.

The analysis revealed that the Delhi NCR landscape is predominantly composed of Barren Land (42%) and Built-up Areas (37%), reflecting the intense urbanization of the region.

| Class | Area (sq. km)| Percentage |
|-------|--------------|------------|
|Barren Land| 2826.19 | 42% |
|Built-up | 2480.14 | 37% |
| Vegetation | 732.27 | 11% |
| Water | 629.54 | 9% |

The model showed strong performance in identifying vegetation and water but exhibited some spectral confusion between built-up areas and barren land, a common challenge in arid and semi-arid urban environments.