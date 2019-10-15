
export interface PageConfig {

  title: string;

  templatePath: string;

  filename: string;

  chunks: string[];

  entries?: { [key: string]: string; };

}
