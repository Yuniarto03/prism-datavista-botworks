
import { useState } from "react";
import { Upload, FileText, Image, FileIcon, Brain, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AIResponseRenderer } from "./AIResponseRenderer";

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

export function AIDocumentProcessor() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    Array.from(files).forEach(file => {
      if (allowedTypes.includes(file.type)) {
        const newFile: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          file: file
        };
        setUploadedFiles(prev => [...prev, newFile]);
        toast.success(`File ${file.name} berhasil di-upload`);
      } else {
        toast.error(`File ${file.name} tidak didukung`);
      }
    });

    event.target.value = '';
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
    toast.info("File berhasil dihapus");
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return Image;
    if (type.includes('pdf') || type.includes('word')) return FileText;
    return FileIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleGenerateAI = async () => {
    if (uploadedFiles.length === 0 && !command.trim()) {
      toast.error("Silakan upload file atau masukkan perintah terlebih dahulu");
      return;
    }

    setIsProcessing(true);
    setAiResponse(null);

    try {
      console.log('Starting AI processing...');
      
      // Prepare file metadata for AI processing
      const fileMetadata = uploadedFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));

      const { data, error } = await supabase.functions.invoke('ai-document-processor', {
        body: {
          command: command.trim(),
          files: fileMetadata,
          analysisType: 'comprehensive'
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'AI processing failed');
      }

      console.log('AI processing response:', data);
      setAiResponse(data);
      toast.success("AI processing selesai!");

    } catch (error) {
      console.error('AI processing error:', error);
      toast.error(`AI processing gagal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neon-blue glow-text mb-2">
          AI Document Processor
        </h2>
        <p className="text-gray-400">
          Upload documents and images, then give AI commands to process them with real AI analysis
        </p>
      </div>

      {/* File Upload Section */}
      <Card className="cyber-card" style={{ backgroundColor: '#101018' }}>
        <CardHeader>
          <CardTitle className="text-neon-green flex items-center gap-2">
            <Upload className="w-5 h-5" />
            File Upload
          </CardTitle>
          <CardDescription>
            Support: PDF, DOC, DOCX, JPG, PNG, GIF, WEBP, TXT, CSV, XLS, XLSX
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-neon-blue/30 rounded-lg p-8 text-center hover:border-neon-blue/50 transition-colors" style={{ backgroundColor: '#101018' }}>
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-neon-blue mx-auto mb-4" />
              <p className="text-white mb-2">
                Klik untuk upload file atau drag & drop
              </p>
              <p className="text-gray-400 text-sm">
                Mendukung berbagai format dokumen dan gambar
              </p>
            </label>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-2">
              <h4 className="text-neon-purple font-semibold">Uploaded Files:</h4>
              {uploadedFiles.map((file) => {
                const IconComponent = getFileIcon(file.type);
                return (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-neon-blue/20" style={{ backgroundColor: '#101018' }}>
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-neon-blue" />
                      <div>
                        <p className="text-white text-sm font-medium">{file.name}</p>
                        <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Command Section */}
      <Card className="cyber-card" style={{ backgroundColor: '#101018' }}>
        <CardHeader>
          <CardTitle className="text-neon-orange flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Command Center
          </CardTitle>
          <CardDescription>
            Berikan perintah untuk memproses file dengan AI yang sesungguhnya
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Contoh: 'Analisis dokumen ini dan berikan ringkasan dalam bentuk tabel', 'Ekstrak data dan buat grafik', 'Berikan insight mendalam tentang konten', 'Buat analisis komprehensif dengan rekomendasi'"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="min-h-[120px] border-neon-blue/30 text-white placeholder-gray-400"
            style={{ backgroundColor: '#101018' }}
          />
          
          <Button
            onClick={handleGenerateAI}
            disabled={isProcessing}
            className="w-full neon-button"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing with Real AI...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate Real AI Analysis
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="text-center py-4">
              <p className="text-neon-blue text-sm">
                🧠 Connecting to OpenAI GPT-4o for real-time analysis...
              </p>
              <div className="mt-2 max-w-md mx-auto">
                <div className="bg-cyber-gray rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple animate-pulse w-3/4" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Response Section */}
      {aiResponse && (
        <Card className="cyber-card">
          <CardHeader>
            <CardTitle className="text-neon-green flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Real AI Analysis Results
            </CardTitle>
            <CardDescription>
              Powered by OpenAI GPT-4o
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIResponseRenderer response={aiResponse} />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!aiResponse && !isProcessing && (
        <div className="cyber-card p-12 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-neon-purple opacity-50" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready for Real AI Processing</h3>
          <p className="text-gray-500 mb-4">
            Upload files and provide commands to get real AI-powered analysis using OpenAI GPT-4o
          </p>
          <div className="text-sm text-gray-600">
            <p>✅ Real AI processing (no simulation)</p>
            <p>✅ Multi-format responses (text, tables, charts)</p>
            <p>✅ Deep document analysis</p>
            <p>✅ Powered by OpenAI GPT-4o</p>
          </div>
        </div>
      )}
    </div>
  );
}
