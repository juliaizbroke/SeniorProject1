"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";
import QuestionEditor from "../../components/QuestionEditor";
import { Question, QuestionMetadata, GenerateResponse } from "../../types";
import { generateExam, getDownloadUrl } from "../../utils/api";

export default function EditPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // Store full pool for shuffling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [metadata, setMetadata] = useState<QuestionMetadata | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionId, setSessionId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [downloadLinks, setDownloadLinks] = useState<GenerateResponse | null>(null);
  useEffect(() => {
    const q = localStorage.getItem("questions");
    const allQ = localStorage.getItem("allQuestions"); // Get full pool if available
    const m = localStorage.getItem("metadata");
    const s = localStorage.getItem("sessionId");

    if (q && m && s) {
      const parsedQuestions = JSON.parse(q);
      setQuestions(parsedQuestions);
      
      // Set full pool - use allQuestions if available, otherwise fall back to current questions
      if (allQ) {
        setAllQuestions(JSON.parse(allQ));
      } else {
        setAllQuestions(parsedQuestions); // Fallback to current questions
      }
      
      // Parse the metadata and ensure selection_settings exists
      const parsedMetadata = JSON.parse(m);
      if (!parsedMetadata.selection_settings) {
        parsedMetadata.selection_settings = {};
      }
      
      setMetadata(parsedMetadata);
      setSessionId(s);
    } else {
      router.replace("/");
    }
  }, [router]);

  const handleStartOver = () => {
    localStorage.clear();
    router.push("/");
  };

  const handleGenerate = async () => {
    if (!metadata || !sessionId) return;
    try {
      setLoading(true);
      setError("");
      const response: GenerateResponse = await generateExam({
        session_id: sessionId,
        questions,
        metadata,
      });
      setDownloadLinks(response);
    } catch (err) {
      setError("Failed to generate exam documents.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Logo />
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {metadata && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Year</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Semester</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.semester}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Exam Type</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.exam_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Exam Type Code</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.exam_type}_{metadata.semester}/{metadata.year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Department</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Program Type</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.program_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Subject Code</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.subject_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Subject Name</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.subject_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Lecturer</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.lecturer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="text-lg font-semibold text-gray-800">{metadata.time}</p>
              </div>
            </div>
          </div>
        )}
        <QuestionEditor questions={questions} onQuestionsChange={setQuestions} />
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleStartOver}
            className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
          >
            Start Over
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Generating..." : "Generate Exam"}
          </button>
        </div>
      </div>
      {downloadLinks && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-4">
                  Documents Generated Successfully!
                </h3>
                <div className="space-y-2">
                  <a
                    href={getDownloadUrl(downloadLinks.exam_url)}
                    className="block px-4 py-2 text-blue-600 bg-white border rounded-lg hover:bg-blue-50"
                    download
                  >
                    Download Exam Paper
                  </a>
                  <a
                    href={getDownloadUrl(downloadLinks.key_url)}
                    className="block px-4 py-2 text-blue-600 bg-white border rounded-lg hover:bg-blue-50"
                    download
                  >
                    Download Answer Key
                  </a>
                </div>
              </div>
            )}
    </main>
  );
}
