import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Check } from 'lucide-react';
import { examQuestions } from './data/questions';

export default function App() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>({});
  const [fontSize, setFontSize] = useState(17);
  const [elapsed, setElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const QUESTIONS_PER_SECTION = 11;
  const TOTAL_SECTIONS = 5;
  const SECTION_TIME = 12 * 60; // 12 minutes
  const sectionQuestions = examQuestions.slice(
    currentSection * QUESTIONS_PER_SECTION,
    (currentSection + 1) * QUESTIONS_PER_SECTION
  );
  const currentQuestion = sectionQuestions[currentIdx];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isFinished || showSectionModal) return;
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= SECTION_TIME) {
          handleNextSection(true);
          return 0;
        }
        // At 3 minutes remaining (9 mins elapsed)
        if (SECTION_TIME - next === 3 * 60) {
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 8000);
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, showSectionModal, currentSection]);

  const handleNextSection = (force = false) => {
    if (currentSection < TOTAL_SECTIONS - 1) {
      if (force) {
        confirmNextSection();
      } else {
        setShowSectionModal(true);
      }
    } else {
      setIsFinished(true);
      setShowSectionModal(false);
    }
  };

  const confirmNextSection = () => {
    setCurrentSection(prev => prev + 1);
    setCurrentIdx(0);
    setElapsed(0);
    setShowSectionModal(false);
  };

  const formatTime = (secs: number) => {
    const rem = SECTION_TIME - secs;
    const m = Math.floor(Math.max(0, rem) / 60);
    const s = Math.max(0, rem) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const nextQ = () => {
    if (currentIdx < sectionQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      handleNextSection();
    }
  };

  const handleSelect = (idx: number) => {
    if (isFinished) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: idx }));
  };

  const prevQ = () => {
    if (currentIdx > 0) setCurrentIdx(prev => prev - 1);
  };

  const toggleBookmark = () => {
    setBookmarks(prev => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
  };

  const changeFontSize = (dir: number) => {
    if (dir === 0) setFontSize(17);
    else setFontSize(prev => Math.max(13, Math.min(22, prev + dir * 2)));
  };

  const restartExam = () => {
    setAnswers({});
    setBookmarks({});
    setCurrentIdx(0);
    setElapsed(0);
    setIsFinished(false);
  };

  const getResults = () => {
    let correct = 0, wrong = 0, skipped = 0;
    examQuestions.forEach(q => {
      const ans = answers[q.id];
      if (ans === undefined || ans === null) skipped++;
      else if (ans === q.correct) correct++;
      else wrong++;
    });
    const pct = Math.round((correct / examQuestions.length) * 100);
    return { correct, wrong, skipped, pct };
  };

  const results = getResults();
  const answeredCountGlobal = Object.values(answers).filter(v => v !== null).length;
  const answeredCountSection = sectionQuestions.filter(q => answers[q.id] !== undefined && answers[q.id] !== null).length;
  const bookmarkCountGlobal = Object.values(bookmarks).filter(Boolean).length;

  const getInstruction = (type: string) => {
    switch (type) {
      case 'تناظر لفظي':
        return (
          <>
            <span className="font-bold">المطلوب:</span> علاقة التناظر اللفظي هي علاقة فيها كلمتين بينهما علاقة لغوية معينة يليهما <span className="font-bold">أربع خيارات</span> <span className="font-bold">أوجد العلاقة الصحيحة والمناسبة</span>
          </>
        );
      case 'إكمال الجمل':
        return (
          <>
            <span className="font-bold">المطلوب:</span> إكمال الجمل هو نص أو حكمة أو مثل ينقصه كلمة أو كلمتين لغويتين تكملان المعنى المقصود أو الجملة المشهورة يليهما <span className="font-bold">أربع خيارات</span> <span className="font-bold">أوجد الكلمتين المناسبتين لوضعهما في الفراغ</span>
          </>
        );
      case 'استيعاب المقروء':
        return (
          <>
            <span className="font-bold">المطلوب:</span> سؤال استيعاب المقروء هو سؤال عن مفردة أو جملة أو علاقة واردة في النص يليها <span className="font-bold">أربع خيارات</span> <span className="font-bold">أوجد الإجابة الصحيحة</span>
          </>
        );
      case 'خطأ سياقي':
        return (
          <>
            <span className="font-bold">المطلوب:</span> الخطأ السياقي هو مفردة أو مفردتين لا يناسبان النص ولا يؤديان معناه وغير متناسق مع المعنى العام في النص يليه <span className="font-bold">أربع خيارات</span> <span className="font-bold">أوجد الخيار الصحيح</span>
          </>
        );
      case 'الكلمة الشاذة':
        return (
          <>
            <span className="font-bold">المطلوب:</span> الكلمة الشاذة هي اختيار المفردة التي لا تنتمي لباقي المجموعة من حيث التصنيف أو المعنى يليه <span className="font-bold">أربع خيارات</span> <span className="font-bold">أوجد الكلمة المختلفة</span>
          </>
        );
      default:
        return <><span className="font-bold">المطلوب:</span> اختر الإجابة الصحيحة من بين الخيارات المتاحة</>;
    }
  };

  return (
    <div className="app-container relative h-screen bg-[#f1f3f4]" dir="rtl">
      {/* Top Bar */}
      <div className="top-bar shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src="https://qemam.org/wp-content/uploads/2025/08/WhatsApp_Image_2025-08-13_at_1.08.19_PM__1_-removebg-preview.png" 
            alt="Logo" 
            className="h-10 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col gap-0.5">
            <div className="text-[13px] font-medium">القسم الحالي : <span className="font-bold text-lg text-[var(--teal)]">{currentSection + 1} من {TOTAL_SECTIONS}</span></div>
            <div className="text-[11px] text-gray-400">محاكاة اختبارات قمم</div>
          </div>
        </div>
        
        <div className="text-[13px] font-medium hidden md:block">الإجابات الكلية : <span className="font-bold text-lg text-[var(--teal)]">{answeredCountGlobal}</span></div>
        <div className="text-[13px] font-medium hidden md:block">الأسئلة المرحلة : <span className="font-bold text-lg text-[var(--orange)]">{bookmarkCountGlobal}</span></div>
        
        {/* Timer at the far left (Last in RTL flex) */}
        <div className="relative">
          <div className={`timer-box !bg-gray-800 !text-white px-5 py-1.5 rounded-full shadow-inner ${(SECTION_TIME - elapsed) <= 180 ? '!bg-red-600 animate-pulse' : ''}`}>
            {formatTime(elapsed)}
          </div>
          
          <AnimatePresence>
            {showAlert && (
              <motion.div
                initial={{ opacity: 0, y: -10, x: '0%' }}
                animate={{ opacity: 1, y: 10, x: '0%' }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-full left-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-lg px-4 py-2 text-[12px] font-bold text-gray-800 whitespace-nowrap z-50 flex items-center gap-2 border-r-4 border-r-[var(--orange)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--orange)] animate-ping" />
                باقي 3 دقائق على انتهاء وقت القسم
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-[var(--gray-200)]">
            <img 
              src="https://qemam.org/wp-content/uploads/2025/08/WhatsApp_Image_2025-08-13_at_1.08.19_PM__1_-removebg-preview.png" 
              alt="Platform Logo" 
              className="w-32 object-contain"
              referrerPolicy="no-referrer"
            />
            <div className="text-[10px] text-[#5f6368] font-bold text-center">أهلاً بك في منصة قمم للتدريب</div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-xs text-[#5f6368]">أسئلة القسم الحالي: <strong className="text-[#202124]">{QUESTIONS_PER_SECTION} سؤال</strong></div>
            <div className="flex flex-wrap gap-1 mt-1">
              <div className="flex items-center gap-1 bg-[#f1f3f4] border border-[#e8eaed] rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34a853]" />
                <span className="font-bold">{answeredCountSection}</span> مجاب
              </div>
              <div className="flex items-center gap-1 bg-[#f1f3f4] border border-[#e8eaed] rounded px-1.5 py-0.5 text-[9px] whitespace-nowrap">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--orange)]" />
                <span className="font-bold">{QUESTIONS_PER_SECTION - answeredCountSection}</span> متبقي
              </div>
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#9aa0a6] font-semibold mb-1">الأسئلة (قسم {currentSection + 1})</div>
            <div className="grid grid-cols-5 gap-1">
              {/* Actual Question Buttons (1-11) */}
              {sectionQuestions.map((q, i) => {
                let cls = 'q-btn';
                if (i === currentIdx) cls += ' active';
                else if (answers[q.id] !== undefined && answers[q.id] !== null) cls += ' answered';
                if (bookmarks[q.id]) cls += ' bookmarked';
                
                return (
                  <button key={q.id} className={cls} onClick={() => setCurrentIdx(i)}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-1.5">
            <button className="w-full p-2 rounded-md bg-[#4285f4] text-white text-xs font-semibold hover:opacity-90 transition-opacity">شرح القسم</button>
            <button 
              className="w-full p-2 rounded-md bg-[#e8eaed] text-[#5f6368] text-xs font-semibold hover:opacity-90 transition-opacity" 
              onClick={() => handleNextSection()}
            >
              {currentSection < TOTAL_SECTIONS - 1 ? 'إنهاء القسم' : 'إنهاء الاختبار'}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col p-4 pr-0 gap-5 overflow-y-auto pt-2">
          <div className="flex justify-between items-center pr-4">
            <div className="bg-[var(--teal)] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
              السؤال <span>{currentIdx + 1}</span>
            </div>
            <div className="flex gap-1">
              <button className="font-btn" onClick={() => changeFontSize(1)}>A+</button>
              <button className="font-btn" onClick={() => changeFontSize(0)}>A</button>
              <button className="font-btn" onClick={() => changeFontSize(-1)}>A-</button>
            </div>
          </div>

          <div className="mx-4 p-3 bg-[#e8eaed] rounded-md text-[12px] text-gray-800 leading-relaxed border-r-4 border-gray-400 shadow-inner">
            {getInstruction(currentQuestion.type)}
          </div>

          {currentQuestion.paragraph && (
            <div className="mx-4 p-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 leading-relaxed shadow-sm">
              <div className="font-bold text-[var(--teal)] mb-2">النص المصاحب للمقروء:</div>
              {currentQuestion.paragraph}
            </div>
          )}

          <div className="px-2">
            <div 
              className="text-[19px] font-bold text-[#202124] leading-relaxed text-right md:text-right" 
              style={{ fontSize: `${fontSize + 2}px` }}
              dangerouslySetInnerHTML={{ __html: currentQuestion.question.replace(': ', ' : <span class="text-[var(--teal)] font-bold">') + (currentQuestion.question.includes(':') ? '</span>' : '') }}
            />
          </div>

          <div className="flex flex-col gap-4 mt-2">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = answers[currentQuestion.id] === i;
              return (
                <div 
                  key={i} 
                  className={`flex items-center gap-3 cursor-pointer p-2 transition-all group ${isSelected ? 'text-[var(--teal)]' : 'text-[#5f6368]'}`}
                  onClick={() => handleSelect(i)}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-[var(--teal)] bg-[var(--teal)]' : 'border-gray-300 group-hover:border-[var(--teal)]'}`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                  </div>
                  <span className={`font-semibold ${isSelected ? 'scale-105 origin-right' : ''} transition-transform`}>{opt}</span>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-center p-3 md:p-5 bg-white border-t border-[var(--gray-200)] shrink-0">
        <label className="flex items-center gap-2 text-xs text-[#5f6368] cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <input 
            type="checkbox" 
            className="accent-[var(--orange)] w-3.5 h-3.5" 
            checked={bookmarks[currentQuestion.id] || false}
            onChange={toggleBookmark}
          />
          اضف السؤال للمراجعة
        </label>
        <div className="flex gap-2 items-center">
          <button className="nav-btn next bg-[var(--teal)] text-white hover:bg-[var(--teal-dark)]" onClick={nextQ}>
            {currentIdx === QUESTIONS_PER_SECTION - 1 ? (currentSection === TOTAL_SECTIONS - 1 ? 'إنهاء الاختبار' : 'إنهاء القسم') : 'حفظ و التالي'}
          </button>
          <button 
            className="nav-btn prev bg-[#e8eaed] text-[#5f6368] hover:bg-[#dadce0] disabled:opacity-40" 
            onClick={prevQ}
            disabled={currentIdx === 0}
          >
            السؤال السابق
          </button>
        </div>
      </div>

      {/* Section Transition Modal */}
      <AnimatePresence>
        {showSectionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-xl p-8 max-w-[450px] w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-[#fff4e5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#ffa000]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">تنبيه الانتقال للقسم التالي</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                هل أنت متأكد من أنك تريد الانتقال للقسم التالي؟ <br />
                <span className="text-red-600 font-bold">لن يمكنك تعديل إجابات هذا القسم بعد الانتقال.</span>
              </p>
              <div className="flex gap-3">
                <button 
                  className="flex-1 py-3 bg-[var(--teal)] text-white font-bold rounded-lg hover:bg-[var(--teal-dark)] transition-colors shadow-lg"
                  onClick={confirmNextSection}
                >
                  موافق، انتقال
                </button>
                <button 
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setShowSectionModal(false)}
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="bg-[var(--teal-dark)] text-white/90 text-center p-2 text-xs font-semibold shrink-0">
        محاكي اختبار نمر — منصة قمم للتدريب
      </div>

      {/* Result Overlay */}
      <AnimatePresence>
        {isFinished && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-xl p-8 text-center max-w-[400px] w-full shadow-2xl"
            >
              <img 
                src="https://qemam.org/wp-content/uploads/2025/08/WhatsApp_Image_2025-08-13_at_1.08.19_PM__1_-removebg-preview.png" 
                alt="Logo" 
                className="h-16 mx-auto mb-4 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="text-xl font-bold text-[var(--teal)] mb-2">منصة قمم للتدريب</div>
              <div 
                className="text-5xl font-bold mb-2" 
                style={{ color: results.pct >= 60 ? 'var(--teal)' : '#ea4335' }}
              >
                {results.pct}%
              </div>
              <div className="text-base text-[#5f6368] mb-5">نتيجة الاختبار النهائية</div>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-[#f8f9fa] rounded-lg p-3">
                  <div className="text-[24px] font-bold text-[#34a853]">{results.correct}</div>
                  <div className="text-[11px] text-[#9aa0a6]">صح</div>
                </div>
                <div className="bg-[#f8f9fa] rounded-lg p-3">
                  <div className="text-[24px] font-bold text-[#ea4335]">{results.wrong}</div>
                  <div className="text-[11px] text-[#9aa0a6]">خطأ</div>
                </div>
                <div className="bg-[#f8f9fa] rounded-lg p-3 col-span-2">
                  <div className="text-[24px] font-bold text-[#4285f4]">{results.skipped} / {examQuestions.length}</div>
                  <div className="text-[11px] text-[#9aa0a6]">أسئلة لم يتم حلها</div>
                </div>
              </div>

              <button 
                className="w-full py-3 bg-[var(--teal)] text-white font-bold rounded-lg hover:shadow-xl transition-all"
                onClick={() => window.location.reload()}
              >
                إجراء اختبار جديد
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
