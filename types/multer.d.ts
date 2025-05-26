declare module 'multer' {
  interface File {
    fieldname: string
    originalname: string
    encoding: string
    mimetype: string
    size: number
    buffer: Buffer
  }

  interface Options {
    storage?: any
    limits?: {
      fileSize?: number
    }
    fileFilter?: (req: any, file: File, cb: (error: Error | null, acceptFile: boolean) => void) => void
  }

  interface Instance {
    single(fieldname: string): (req: any, res: any, next?: any) => void
    array(fieldname: string, maxCount?: number): (req: any, res: any, next?: any) => void
  }

  function multer(options?: Options): Instance

  namespace multer {
    function memoryStorage(): any
    function diskStorage(options: any): any
  }

  export = multer
}

declare global {
  namespace Express {
    interface Request {
      file?: import('multer').File
      files?: import('multer').File[]
    }
  }
} 