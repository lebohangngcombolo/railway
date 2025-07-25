import React, { useState } from "react";
import { FaPiggyBank, FaChartLine, FaCreditCard, FaUniversity } from "react-icons/fa";
import { ArrowLeft, Home, Loader2 } from "lucide-react"; // or any icon library
import { useNavigate } from "react-router-dom"; // Assuming you're using react-router-dom for navigation

const courseIcons = {
  budgeting: <FaCreditCard className="text-blue-500 text-3xl" />,
  credit: <FaUniversity className="text-green-500 text-3xl" />,
  saving: <FaPiggyBank className="text-pink-500 text-3xl" />,
  investing: <FaChartLine className="text-purple-500 text-3xl" />,
};

const courses = [
  {
    id: "budgeting",
    title: "Budgeting 101",
    description: "Master the basics of budgeting and take control of your finances.",
    icon: courseIcons.budgeting,
    lessons: [
      {
        title: "Why Budget?",
        videoUrl: "https://www.youtube.com/embed/xEPHsUtLFDA?si=87NlK6ZAXsqFkEmM",
        content: "Learn why budgeting is the foundation of financial success.",
      },
      {
        title: "How to Track Expenses",
        videoUrl: "https://www.youtube.com/embed/ZmthxqxuFQI?si=EEB4LR67COwYHO-V",
        content: "Discover simple ways to track your spending and stay on budget.",
      },
      {
        title: "Setting Savings Goals",
        videoUrl: "https://www.youtube.com/embed/Duxo4xXeMec?si=zXCSrtBge_T3TrIA",
        content: "Set realistic savings goals and achieve them step by step.",
      },
    ],
    quiz: {
      questions: [
        {
          q: "What is the first step in budgeting?",
          options: ["Set a savings goal", "List income and expenses", "Track investments", "Pay off debt"],
          answer: 1,
        },
        {
          q: "Why is it important to track your expenses?",
          options: ["To impress friends", "To control spending", "To get a loan", "To pay more tax"],
          answer: 1,
        },
      ],
    },
  },
  {
    id: "credit",
    title: "Building Credit",
    description: "Understand credit, loans, and how to build a strong credit score.",
    icon: courseIcons.credit,
    lessons: [
      {
        title: "How Credit Works",
        videoUrl: "https://www.youtube.com/embed/f2ortkJfTKw?si=HULnJ6W2nePkjE8a",
        content: "Get the basics of credit and why it matters.",
      },
      {
        title: "Tips for Good Credit",
        videoUrl: "https://www.youtube.com/embed/NcX0k2FiF2g?si=DCJna0UsnAWjnSTY",
        content: "Practical tips to build and maintain a healthy credit score.",
      },
    ],
    quiz: {
      questions: [
        {
          q: "What helps build a good credit score?",
          options: ["Paying bills late", "Maxing out credit cards", "Paying on time", "Ignoring your credit report"],
          answer: 2,
        },
      ],
    },
  },
  {
    id: "saving",
    title: "Smart Saving",
    description: "Learn strategies to save more and reach your financial goals faster.",
    icon: courseIcons.saving,
    lessons: [
      {
        title: "Why Save?",
        videoUrl: "https://www.youtube.com/embed/JqYoLQXO7j4?si=yUqtDei4os8LFy_Q",
        content: "Understand the importance of saving for emergencies and future goals.",
      },
      {
        title: "Automating Your Savings",
        videoUrl: "https://www.youtube.com/embed/H-YT783ftGM?si=dguTbDD9pu0zsxDM",
        content: "How to set up automatic savings and make it a habit.",
      },
    ],
    quiz: {
      questions: [
        {
          q: "What is a good reason to save money?",
          options: ["To buy unnecessary things", "For emergencies and future goals", "To lend to friends", "To avoid budgeting"],
          answer: 1,
        },
      ],
    },
  },
  {
    id: "investing",
    title: "Investing on EasyEquities",
    description: "A beginner's guide to investing using EasyEquities.",
    icon: courseIcons.investing,
    lessons: [
      {
        title: "What is EasyEquities?",
        videoUrl: "https://www.youtube.com/embed/xBq2dO8GHVE?si=KAQn5PHvu_Kkeo-P",
        content: "Learn about the EasyEquities platform and how it works.",
      },
      {
        title: "How to Start Investing",
        videoUrl: "https://www.youtube.com/embed/3I8lrwq1FVg?si=84gDgnTaj_0jNhVD",
        content: "Step-by-step guide to making your first investment.",
      },
    ],
    quiz: {
      questions: [
        {
          q: "What is the first step to start investing on EasyEquities?",
          options: ["Open an account", "Buy a car", "Withdraw money", "Close your stokvel"],
          answer: 0,
        },
      ],
    },
  },
];

function getInitialProgress() {
  const saved = localStorage.getItem("courseProgress");
  if (saved) return JSON.parse(saved);
  return {};
}

const LearningContent: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [progress, setProgress] = useState(getInitialProgress());
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [q: number]: number }>({});
  const [quizResult, setQuizResult] = useState<null | boolean>(null);
  const [showLoader, setShowLoader] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (selectedCourse === null) {
      setShowLoader(true);
      const timer = setTimeout(() => setShowLoader(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowLoader(false);
    }
  }, [selectedCourse]);

  // Make sure this function is present:
  const handleCompleteLesson = () => {
    if (!selectedCourse) return;
    const course = courses.find(c => c.id === selectedCourse)!;
    const newProgress = {
      ...progress,
      [selectedCourse]: {
        completed: [
          ...(progress[selectedCourse]?.completed || []),
          currentLesson,
        ],
        lastLesson: Math.min(currentLesson + 1, course.lessons.length - 1),
      },
    };
    setProgress(newProgress);
    localStorage.setItem("courseProgress", JSON.stringify(newProgress));
    if (currentLesson < course.lessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      setShowQuiz(true);
    }
  };

  // --- Loader (NO Home icon, message centered) ---
  if (showLoader && selectedCourse === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin w-12 h-12 text-blue-600 mb-6" />
        <h2 className="text-xl font-semibold text-blue-800 mb-2 text-center">
          Redirecting you to the learning platform…
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Please wait while we prepare your learning experience.
        </p>
      </div>
    );
  }

  // --- Catalog/Landing page (Home icon visible) ---
  if (selectedCourse === null) {
    return (
      <>
        <button
          className="fixed top-6 left-6 z-50 p-2 rounded-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
          onClick={() => navigate("/dashboard")}
          title="Go to Dashboard"
          aria-label="Go to Dashboard"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
        >
          <Home className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center w-full">
          {/* Hero Section */}
          <div className="w-full flex flex-col items-center justify-center py-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-4 text-center drop-shadow">
              Grow Your Financial Skills
            </h1>
            <p className="text-lg md:text-xl text-blue-700 mb-8 text-center max-w-2xl">
              Take free, practical courses on budgeting, saving, credit, and investing. Learn at your own pace, track your progress, and test your knowledge!
            </p>
            <button
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition text-lg"
              onClick={() => setSelectedCourse(courses[0].id)}
            >
              Start Learning Now
            </button>
          </div>
          {/* Course Catalog */}
          <h2 className="text-2xl font-bold text-blue-700 mb-6 mt-8">Available Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl px-4">
            {courses.map(course => {
              const courseProgress = progress[course.id]?.completed?.length || 0;
              const total = course.lessons.length;
              const percent = Math.round((courseProgress / total) * 100);
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition p-6 flex flex-col items-center"
                  style={{ minHeight: 270 }}
                >
                  <div className="mb-4">{course.icon}</div>
                  <h3 className="text-lg font-bold text-blue-800 mb-2 text-center">{course.title}</h3>
                  <p className="text-gray-700 mb-4 text-center">{course.description}</p>
                  <div className="mb-2 w-full">
                    <div className="h-2 bg-blue-100 rounded">
                      <div
                        className="h-2 bg-blue-500 rounded"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      Progress: {courseProgress} / {total} lessons
                    </div>
                  </div>
                  <button
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
                    onClick={() => setSelectedCourse(course.id)}
                  >
                    {courseProgress === total ? "Review" : courseProgress > 0 ? "Continue" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Course detail view
  const course = courses.find(c => c.id === selectedCourse)!;
  const lesson = course.lessons[currentLesson];
  const completedLessons = progress[selectedCourse]?.completed || [];

  return (
    <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row gap-8 pt-8 w-full">
      {/* Sidebar */}
      <aside className="bg-white rounded-xl shadow-lg p-6 w-full md:w-1/3 mb-8 md:mb-0">
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
          onClick={() => setSelectedCourse(null)}
          title="Back to Learning Home"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <h2 className="text-xl font-bold text-blue-800 mb-4">{course.title}</h2>
        <ul>
          {course.lessons.map((l, idx) => (
            <li
              key={l.title}
              className={`mb-3 px-2 py-2 rounded cursor-pointer flex items-center ${
                idx === currentLesson
                  ? "bg-blue-100 text-blue-800 font-semibold"
                  : "hover:bg-blue-50 text-gray-700"
              }`}
              onClick={() => {
                setCurrentLesson(idx);
                setShowQuiz(false);
                setQuizResult(null);
              }}
            >
              <span className="mr-2">{idx + 1}.</span> {l.title}
              {completedLessons.includes(idx) && (
                <span className="ml-auto text-green-500 font-bold">✓</span>
              )}
            </li>
          ))}
          <li
            className={`mt-6 px-2 py-2 rounded cursor-pointer font-semibold ${
              showQuiz ? "bg-blue-200 text-blue-900" : "hover:bg-blue-50 text-blue-700"
            }`}
            onClick={() => setShowQuiz(true)}
          >
            Quiz & Certificate
          </li>
        </ul>
      </aside>
      {/* Main Content */}
      <main className="flex-1 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <button
            className="p-2 rounded-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition"
            onClick={() => navigate("/dashboard")}
            title="Go to Dashboard"
            aria-label="Go to Dashboard"
            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <Home className="w-5 h-5" />
          </button>
          <span className="ml-2 text-gray-500 text-sm">Learning Platform</span>
        </div>
        {!showQuiz ? (
          <>
            <div className="mb-2 text-sm text-blue-600 font-semibold">
              Lesson {currentLesson + 1} of {course.lessons.length}
            </div>
            <h3 className="text-2xl font-bold mb-4">{lesson.title}</h3>
            <iframe
              width="100%"
              height="300"
              src={lesson.videoUrl}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg mb-4"
            ></iframe>
            <div className="mb-6 text-lg">{lesson.content}</div>
            <div className="flex justify-between items-center">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
                disabled={currentLesson === 0}
              >
                Previous
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={handleCompleteLesson}
                disabled={completedLessons.includes(currentLesson)}
              >
                {currentLesson === course.lessons.length - 1 ? "Finish & Take Quiz" : "Complete & Next"}
              </button>
            </div>
          </>
        ) : (
          <div>
            <h3 className="text-2xl font-bold mb-4">Quiz: {course.title}</h3>
            {course.quiz.questions.map((q, idx) => (
              <div key={idx} className="mb-6">
                <div className="mb-2 font-semibold">{idx + 1}. {q.q}</div>
                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oidx) => (
                    <label key={oidx} className="flex items-center">
                      <input
                        type="radio"
                        name={`quiz-${idx}`}
                        checked={quizAnswers[idx] === oidx}
                        onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: oidx })}
                        className="mr-2"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {quizResult === null ? (
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded font-semibold"
                onClick={() => {
                  if (!selectedCourse) return;
                  const course = courses.find(c => c.id === selectedCourse)!;
                  const correct = course.quiz.questions.every(
                    (q, idx) => quizAnswers[idx] === q.answer
                  );
                  setQuizResult(correct);
                }}
              >
                Submit Quiz
              </button>
            ) : quizResult ? (
              <div className="text-green-600 font-bold text-lg mt-4">
                🎉 Congratulations! You passed the quiz!
              </div>
            ) : (
              <div className="text-red-600 font-bold text-lg mt-4">
                Some answers are incorrect. Please review and try again.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default LearningContent;
