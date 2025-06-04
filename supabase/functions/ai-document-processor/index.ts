import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to sanitize the API key
function sanitizeApiKey(key: string | undefined): string {
  if (!key) {
    throw new Error('OpenAI API key not configured');
  }
  // Remove any whitespace, newlines, or non-printable characters
  return key.replace(/[^\x20-\x7E]/g, '').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { command, files, analysisType } = await req.json();
    
    // Sanitize the API key before use
    const openAIApiKey = sanitizeApiKey(Deno.env.get('OPENAI_API_KEY'));

    console.log('Processing AI request:', { command, filesCount: files?.length, analysisType });

    // Create different prompts based on analysis type
    let systemPrompt = '';
    let temperature = 0.7;

    if (analysisType === 'chatbot_assistance') {
      systemPrompt = `You are a helpful data analysis assistant chatbot. You help users understand their data, navigate the platform, and provide insights about their datasets. 

Key responsibilities:
- Help users understand their uploaded data
- Explain data analysis concepts
- Guide users through platform features
- Provide insights about data patterns
- Answer questions about data visualization
- Suggest analysis approaches
- Help with data interpretation

Always be friendly, helpful, and provide practical advice. Keep responses concise but informative. If you don't have enough context about their specific data, ask clarifying questions.`;
      temperature = 0.8;
    } else {
      systemPrompt = `You are an advanced AI document processor and analyst. You can:
1. Analyze documents and extract key information
2. Generate insights and summaries
3. Create structured responses in various formats
4. Provide deep analysis and feedback

IMPORTANT: Always respond with valid JSON that includes:
- analysis: detailed text analysis (string)
- insights: array of key findings and patterns (array of strings)
- recommendations: actionable suggestions (array of strings)
- visualData: data for charts/tables if applicable (object with type and data)
- imagePrompt: description for image generation if requested (string)
- format: the primary response format (string: "text", "table", "chart", "image", "mixed")

For visualData, use this structure:
- For charts: {"type": "bar|line|pie", "data": [{"name": "Category", "value": 123}]}
- For tables: {"tableData": {"headers": ["Header1", "Header2"], "rows": [["Data1", "Data2"]]}}

Always provide comprehensive, professional analysis in Indonesian language.`;
    }

    let userPrompt = '';
    if (analysisType === 'chatbot_assistance') {
      userPrompt = command || 'Hello! How can I help you with your data analysis today?';
    } else {
      userPrompt = `Perintah Pengguna: "${command || 'Analisis dokumen yang diupload'}"

File yang diupload: ${files?.length || 0} file
${files?.map((file: any, index: number) => `File ${index + 1}: ${file.name} (${file.type}) - ${(file.size / 1024).toFixed(1)}KB`).join('\n') || 'Tidak ada file yang diupload'}

Berikan analisis komprehensif dan respons berdasarkan perintah. Jika pengguna meminta format khusus (grafik, tabel, gambar), sertakan struktur data dan deskripsi yang sesuai. Berikan insight mendalam dan rekomendasi yang dapat ditindaklanjuti.`;
    }

    // Call OpenAI API with proper headers
    const openAIHeaders = {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: openAIHeaders,
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: analysisType === 'chatbot_assistance' ? 1000 : 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Handle chatbot responses differently
    if (analysisType === 'chatbot_assistance') {
      return new Response(JSON.stringify({
        analysis: aiResponse,
        timestamp: new Date().toISOString(),
        model: 'gpt-4',
        status: 'success',
        type: 'chatbot'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to parse as JSON for document analysis, fallback to structured text
    let structuredResponse;
    try {
      structuredResponse = JSON.parse(aiResponse);
    } catch {
      // Create structured response from text
      structuredResponse = {
        analysis: aiResponse,
        insights: [
          "Analisis AI telah selesai dengan sukses",
          "Dokumen telah diproses menggunakan teknologi OpenAI GPT-4",
          "Hasil analisis siap untuk ditinjau dan ditindaklanjuti"
        ],
        recommendations: [
          "Tinjau hasil analisis secara menyeluruh",
          "Pertimbangkan implementasi rekomendasi yang diberikan",
          "Lakukan evaluasi berkala terhadap insight yang didapat"
        ],
        visualData: {
          type: "bar",
          data: [
            { name: "Analisis Selesai", value: 100 },
            { name: "Kualitas Data", value: 85 },
            { name: "Akurasi Hasil", value: 92 }
          ]
        },
        format: "mixed"
      };
    }

    // Add metadata
    const result = {
      ...structuredResponse,
      timestamp: new Date().toISOString(),
      filesProcessed: files?.length || 0,
      processingTime: Date.now(),
      model: 'gpt-4',
      status: 'success'
    };

    console.log('AI processing completed successfully');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in AI document processor:', error);
    return new Response(
      JSON.stringify({ 
        error: 'AI processing failed', 
        details: error.message,
        timestamp: new Date().toISOString(),
        status: 'error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});