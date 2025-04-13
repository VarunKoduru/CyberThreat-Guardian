import { Button } from "@/components/ui/button";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  maxSize?: number; // in MB
  accept?: string;
  isLoading?: boolean;
}

export function FileDropzone({
  onFileSelect,
  maxSize = 25,
  accept = ".exe,.dll,.bat,.cmd,.msi,.js,.com,.scr,.ps1",
  isLoading = false
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File is too large. Maximum file size is ${maxSize}MB.`);
      return false;
    }

    // If accept is specified, check file type
    if (accept && accept !== "*") {
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const acceptedTypes = accept.split(',');
      
      if (!acceptedTypes.some(type => {
        // Handle wildcards like application/* or */pdf
        if (type.includes('*')) {
          const wildCardRegex = new RegExp('^' + type.replace('*', '.*') + '$');
          return wildCardRegex.test(file.type) || wildCardRegex.test(fileExtension);
        }
        return type === fileExtension || type === file.type;
      })) {
        setError(`Invalid file type. Accepted types: ${accept}`);
        return false;
      }
    }

    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleBrowseClick = () => {
    if (isLoading) return;
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-all ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : isLoading 
              ? "border-gray-300 bg-gray-50 opacity-70" 
              : error 
                ? "border-red-300" 
                : "border-gray-300 hover:border-primary"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Upload className="h-6 w-6 text-primary" />
                </motion.div>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"
              >
                <AlertCircle className="h-6 w-6 text-red-500" />
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
              >
                <Upload className="h-6 w-6 text-primary" />
              </motion.div>
            )}
          </AnimatePresence>

          <h3 className="mt-4 text-sm font-medium text-gray-900">
            {isLoading ? "Uploading file..." : "Upload a file for scanning"}
          </h3>
          
          <p className="mt-1 text-xs text-gray-500">
            {error || `Drag and drop or click to browse. Max size: ${maxSize}MB`}
          </p>
          
          {!isLoading && !error && (
            <div className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
                disabled={isLoading}
              >
                Browse Files
              </Button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
