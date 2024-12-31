type FormSettings = {
  [key: string]: any;
  cType: "Form" | "FormGroup" | "Checkbox" | "RadioButtonGroup" | "RadioButton" | "Select" | "SelectItem" | "Button" | "FileUploader";
  children?: FormSettings[];
}


declare type FunctionParsType = typeof ManifoldNamespace & {
  cv: typeof cv;
} & {
  viewer: {
    render: (manifold: ManifoldNamespace.Manifold | String | OffscreenCanvas, name = 'main') => Promise<void>;
    clear: () => void;
    notify: (data: {
      title?: string;
      subtitle?: string;
      kind?: 'success' | 'error' | 'info' | 'warning';
      timeout?: number;
      [key: string]: any;
    }) => void;
  }
} & {
  form: {
    set: (formSettings: FormSettings[]) => void;
    on: (event: 'submit' | 'change', callback: (data: any) => void) => void;
    getValue: () => {
      [key: string]: any;
    }
  } 
} & {
  helper: {
    getShapesFromCntAndHierarchy(
      contours: cv.MatVector,
      hierarchy: cv.Mat,
      sizeOfPerPix = 1
    ): {
      points: [number, number][];
      holes: [number, number][][];
    }[];
    getCrossSectionFromShape(
      shape: {
        points: [number, number][];
        holes: [number, number][][];
      }
    ): ManifoldNamespace.CrossSection;
    getCrossSectionFromShapes(
      shapes: {
        points: [number, number][];
        holes: [number, number][][];
      }[]
    ): ManifoldNamespace.CrossSection;
    imageDataToCrossSection(
      imageData: ImageData,
      threshold = 128,
      sizeOfPerPix = 1
    ): ManifoldNamespace.CrossSection;
  }
}