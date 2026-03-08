export type PropertyImage = {
  src: string;
};

export type Property = {
  name: string;
  slug: string;
  location: string;
  rate: string;
  beds: number;
  baths: number;
  area: number;
  images: PropertyImage[];
};
