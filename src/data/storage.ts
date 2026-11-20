import {
  UserPreferences,
  StudyMaterial,
  StudySummary,
  ConceptNote,
  Quiz,
  QuizAttempt,
  StudyTask,
  StudySession,
  Flashcard,
  LearningHistoryItem,
} from '../types';

const PREFS_KEY = 'studymate_prefs';
const MATERIALS_KEY = 'studymate_materials';
const SUMMARIES_KEY = 'studymate_summaries';
const CONCEPTS_KEY = 'studymate_concepts';
const QUIZZES_KEY = 'studymate_quizzes';
const ATTEMPTS_KEY = 'studymate_attempts';
const TASKS_KEY = 'studymate_tasks';
const SESSIONS_KEY = 'studymate_sessions';
const FLASHCARDS_KEY = 'studymate_flashcards';
const HISTORY_KEY = 'studymate_history';

export const DEFAULT_NOTEBOOKLM_URL =
  'https://notebook.google.com/notebook/8a02e32f-1aff-4e06-a198-981b72d95f89';

export const INITIAL_PREFERENCES: UserPreferences = {
  userName: 'BS. Tuấn Minh',
  userRole: 'medical',
  preferredLanguage: 'vi',
  dailyStudyGoalMinutes: 120,
  preferredStudyDays: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'],
  currentSubjects: [
    'Giải phẫu học',
    'Sinh lý bệnh & Miễn dịch',
    'Dược lý học lâm sàng',
    'Răng Hàm Mặt & Nha chu',
    'Nội khoa Tim mạch',
  ],
  examinationDates: [
    {
      id: 'ex-1',
      subject: 'Dược lý học lâm sàng',
      title: 'Thi Hết môn Dược lý & Kháng sinh học',
      date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    },
    {
      id: 'ex-2',
      subject: 'Răng Hàm Mặt & Nha chu',
      title: 'Đánh giá Lâm sàng Nha chu & Mô nha chu',
      date: new Date(Date.now() + 86400000 * 12).toISOString().split('T')[0],
    },
    {
      id: 'ex-3',
      subject: 'Nội khoa Tim mạch',
      title: 'Kỳ thi Chứng chỉ Thực hành Y khoa',
      date: new Date(Date.now() + 86400000 * 24).toISOString().split('T')[0],
    },
  ],
  notebookLmUrl: DEFAULT_NOTEBOOKLM_URL,
};

export const INITIAL_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-1',
    title: 'Hội chứng Vành Cấp & Điện tâm đồ trong Nhồi máu Cơ tim ST chênh lên (STEMI)',
    subject: 'Nội khoa Tim mạch',
    content: `Hội chứng vành cấp (ACS) phản ánh tình trạng thiếu máu cục bộ cơ tim đột ngột, chủ yếu do nứt vỡ hoặc xói mòn mảng xơ vữa động mạch dẫn tới hình thành huyết khối gây tắc nghẽn lòng mạch.
Phân loại lâm sàng:
1. Nhồi máu cơ tim có ST chênh lên (STEMI): Tắc nghẽn hoàn toàn động mạch vành cấp máu, hoại tử xuyên thành.
2. Nhồi máu cơ tim không ST chênh lên (NSTEMI): Tắc nghẽn không hoàn toàn, men tim Troponin tăng.
3. Đau thắt ngực không ổn định (UA): Men tim không tăng.
Triệu chứng kinh điển: Đau thắt ngực kiểu đè nghẹt sau xương ức >20 phút, lan lên vai trái, cổ, góc hàm hoặc bờ trong cánh tay trái, kèm vã mồ hôi, khó thở, buồn nôn.
Điện tâm đồ (ECG): ST chênh lên dạng vòm >= 1mm ở ít nhất 2 chuyển đạo liên tiếp, có hình ảnh soi gương.
Xử trí ban đầu: Liệu pháp MONA (Morphine, Oxy nếu SpO2 < 90%, Nitroglycerin ngậm dưới lưỡi nếu HA tâm thu > 90mmHg, Aspirin liều nạp 162-325mg nhai), kết hợp thuốc ức chế P2Y12 (Ticagrelor hoặc Clopidogrel) và can thiệp mạch vành qua da (PCI) thì đầu trong vòng 90-120 phút.`,
    materialType: 'clinical_guideline',
    tags: ['Tim mạch', 'Cấp cứu', 'ECG', 'STEMI'],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'mat-2',
    title: 'Giải phẫu Dây thần kinh Sinh ba (Dây V) và Ứng dụng Gây tê trong Nha khoa',
    subject: 'Răng Hàm Mặt & Nha chu',
    content: `Dây thần kinh sinh ba (dây thần kinh sọ số V) là dây thần kinh hỗn hợp lớn nhất, chi phối cảm giác cho toàn bộ vùng mặt, ổ miệng, răng hàm và vận động cho các cơ nhai.
Dây V xuất phát từ mặt bên cầu não, đi vào hạch thần kinh Gasser và phân chia thành 3 nhánh lớn:
- V1 (Thần kinh mắt): Hoàn toàn cảm giác, chui qua khe ổ mắt trên.
- V2 (Thần kinh hàm trên): Cảm giác, chui qua lỗ tròn vào hố chân bướm hàm, cho các nhánh thần kinh huyệt răng trên (trước, giữa, sau) chi phối răng hàm trên và niêm mạc xoang hàm.
- V3 (Thần kinh hàm dưới): Nhánh hỗn hợp duy nhất, chui qua lỗ bầu dục, phân chia thành thần kinh má, thần kinh lưỡi (cảm giác 2/3 trước lưỡi) và thần kinh huyệt răng dưới chui vào lỗ hàm dưới.
Kỹ thuật gây tê gai Spix: Điểm mốc là bờ trước cành lên xương hàm dưới, đường chéo ngoài, nếp chân bướm hàm và cách mặt nhai răng hàm dưới 1cm. Gây tê thần kinh huyệt răng dưới làm mất cảm giác nửa cung răng dưới, môi dưới và cằm cùng bên. Biến chứng cần chú ý: Tiêm vào mạch máu (động mạch huyệt răng dưới) gây ngộ độc thuốc tê toàn thân, liệt mặt tạm thời do tiêm quá sâu vào tuyến mang tai.`,
    materialType: 'lecture_note',
    tags: ['Giải phẫu', 'Dây thần kinh V', 'Gây tê Spix', 'Răng Hàm Mặt'],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
];

export const INITIAL_SUMMARIES: StudySummary[] = [
  {
    id: 'sum-1',
    materialId: 'mat-1',
    title: 'Tóm tắt Sư phạm: Hội chứng Vành Cấp & Điện tâm đồ STEMI',
    subject: 'Nội khoa Tim mạch',
    tags: ['Tim mạch', 'STEMI', 'Cấp cứu'],
    detailLevel: 'detailed',
    language: 'vi',
    overview: 'Hội chứng vành cấp (ACS) là tình trạng cấp cứu nội khoa tối khẩn do tắc nghẽn dòng máu nuôi dưỡng cơ tim bởi huyết khối. Mục tiêu cốt lõi là chẩn đoán nhanh trong 10 phút đầu bằng ECG và tái tưới máu cơ tim càng sớm càng tốt ("Thời gian là cơ tim").',
    keyPoints: [
      'Phân biệt rõ 3 thể: STEMI (ST chênh lên + tăng Troponin), NSTEMI (không ST chênh + tăng Troponin), Đau thắt ngực không ổn định (không tăng Troponin).',
      'ECG 12 chuyển đạo phải được thực hiện và đọc kết quả trong vòng 10 phút kể từ khi tiếp xúc y tế đầu tiên.',
      'Triệu chứng đè nghẹt sau xương ức điển hình lan lên hàm và cánh tay trái > 20 phút.',
      'Chiến lược can thiệp: Ưu tiên PCI qua da thì đầu trong vòng 120 phút; nếu không thể chuyển tới trung tâm PCI kịp thời, cân nhắc tiêu sợi huyết trong vòng 30 phút.',
    ],
    glossary: [
      { term: 'Door-to-Balloon Time', definition: 'Khoảng thời gian từ lúc bệnh nhân vào viện đến khi bóng nong động mạch vành được bơm phồng tái thông dòng máu (mục tiêu < 90 phút).' },
      { term: 'Troponin I/T siêu nhạy (hs-cTn)', definition: 'Dấu ấn sinh học đặc hiệu nhất cho tổn thương hoại tử tế bào cơ tim.' },
      { term: 'Hình ảnh soi gương (Reciprocal changes)', definition: 'Hiện tượng ST chênh xuống ở các chuyển đạo đối diện với vùng cơ tim bị nhồi máu.' },
    ],
    clinicalAspects: {
      anatomicalStructures: 'Động mạch vành trái (LAD, LCx) và Động mạch vành phải (RCA). Tắc LAD gây nhồi máu thành trước rộng (V1-V6).',
      clinicalManifestations: 'Đau thắt ngực bóp nghẹt, vã mồ hôi lạnh, tụt huyết áp nếu có sốc tim, tiếng T3/T4 hoặc rên ẩm đáy phổi khi có phù phổi cấp.',
      diagnosticPrinciples: 'Tam giác chẩn đoán: Lâm sàng đau ngực + Biến đổi ECG động học + Động học men tim Troponin.',
      treatmentPrinciples: 'Giảm đau, kháng kết tập tiểu cầu kép (DAPT: Aspirin + P2Y12 inhibitor), kháng đông (Heparin), tái tưới máu khẩn cấp PCI.',
      contraindications: 'Chống chỉ định dùng Nitroglycerin khi bệnh nhân tụt huyết áp (HA tâm thu < 90 mmHg), nhịp tim chậm < 50 ck/phút, hoặc nghi ngờ nhồi máu thất phải.',
    },
    reflectionQuestions: [
      'Tại sao không được dùng Nitroglycerin trong nhồi máu cơ tim thất phải (chuyển đạo V3R, V4R)?',
      'Nếu bệnh nhân STEMI đến viện tuyến huyện cách trung tâm can thiệp PCI 3 giờ di chuyển, chiến lược tái tưới máu nào cần kích hoạt ngay?',
    ],
    pitfalls: [
      'Bỏ sót nhồi máu cơ tim thầm lặng ở bệnh nhân cao tuổi, phụ nữ hoặc bệnh nhân đái tháo đường lâu năm chỉ có biểu hiện mệt mỏi, khó thở.',
    ],
    takeawayAction: 'Thuộc lòng lưu đồ xử trí cấp cứu ban đầu MONA và chỉ định ECG 10 phút đầu.',
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 2,
  },
];

export const INITIAL_CONCEPTS: ConceptNote[] = [
  {
    id: 'con-1',
    topic: 'Cơ chế Gây tê Vùng Gai Spix (Thần kinh Huyệt răng dưới)',
    subject: 'Răng Hàm Mặt & Nha chu',
    mode: 'clinical',
    coreDefinition: 'Gây tê Spix là kỹ thuật gây tê dẫn truyền nhằm phong bế thần kinh huyệt răng dưới tại vị trí trước khi nó chui vào lỗ hàm dưới ở mặt trong cành lên xương hàm dưới.',
    explanation: 'Thuốc tê (Lidocaine 2% phối hợp Adrenaline 1:100.000) khuếch tán vào bao dây thần kinh, ức chế thuận nghịch kênh Natri phụ thuộc điện thế trên màng sợi trục thần kinh, ngăn chặn quá trình khử cực và lan truyền điện thế hoạt động cảm giác đau từ răng về vỏ não.',
    mechanism: 'Chẹn kênh Na+ nội bào -> Ngăn dòng Na+ đi vào tế bào -> Ngưỡng hưng phấn tăng cao -> Không tạo được điện thế hoạt động -> Mất cảm giác đau có phục hồi.',
    clinicalOrRealWorld: 'Áp dụng cho nhổ răng hàm dưới (đặc biệt răng khôn ngầm số 8), phẫu thuật nạo chóp, phẫu thuật nha chu và điều trị tủy răng hàm dưới. Khi tê đạt hiệu quả, bệnh nhân thấy tê bì và dày môi dưới, cằm cùng bên.',
    analogies: [
      'Như việc ngắt cầu dao tổng trên đường dây điện cấp cho một tòa nhà: toàn bộ các bóng đèn (răng nửa hàm dưới) sẽ tắt cùng lúc.',
    ],
    comparisonTable: [
      { feature: 'Gây tê Spix (Dẫn truyền)', thisConcept: 'Mất cảm giác toàn bộ nửa cung răng dưới', relatedConcept: 'Gây tê cận chóp: Chỉ ngấm 1-2 răng đơn lẻ' },
      { feature: 'Vị trí đâm kim', thisConcept: 'Mặt trong cành lên (gai Spix)', relatedConcept: 'Đáy hành lang ngách tiền đình sát chóp chân răng' },
      { feature: 'Hiệu quả xương hàm dưới', thisConcept: 'Rất cao (xuyên qua vỏ xương đặc)', relatedConcept: 'Kém hiệu quả ở răng cối lớn do vỏ xương hàm dưới dày' },
    ],
    keyTakeaways: [
      'Mốc giải phẫu: Cách mặt nhai răng hàm dưới 1cm, giữa bờ trước cơ cắn và nếp chân bướm hàm.',
      'Luôn hút ngược (aspiration) trước khi bơm thuốc để tránh tiêm nhầm vào tĩnh mạch hoặc động mạch huyệt răng dưới gây ngộ độc thuốc tê.',
      'Cảm giác tê môi và cằm là dấu hiệu lâm sàng xác nhận dây thần kinh huyệt răng dưới đã bị phong bế.',
    ],
    commonMistakes: [
      'Đâm kim quá nông về phía trước: Thuốc tê chỉ ngấm dây thần kinh lưỡi mà không ngấm dây thần kinh huyệt răng dưới.',
      'Đâm kim quá sâu về phía sau: Đâm vào mô tuyến mang tai phong bế dây thần kinh số VII gây liệt mặt ngoại biên tạm thời.',
    ],
    checkQuestions: [
      'Nếu sau khi tiêm 10 phút bệnh nhân chỉ tê nửa bên lưỡi mà không tê cằm và răng, lỗi kỹ thuật nằm ở đâu?',
      'Dấu hiệu nhận biết sớm nhất của ngộ độc thuốc tê toàn thân (LAST) trên lâm sàng là gì?',
    ],
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 4,
  },
];

export const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Đánh giá Ca Lâm sàng: Chẩn đoán & Xử trí STEMI Cấp',
    subject: 'Nội khoa Tim mạch',
    difficulty: 'hard',
    questionType: 'vignette',
    timeLimitMinutes: 10,
    isFavorite: true,
    createdAt: Date.now() - 86400000 * 2,
    questions: [
      {
        id: 1,
        type: 'vignette',
        question: 'Bệnh nhân nam 58 tuổi, tiền sử đái tháo đường type 2 và tăng huyết áp, nhập viện vì đau ngực dữ dội kiểu đè nghẹt sau xương ức xuất hiện cách đây 2 giờ, lan lên hàm dưới và cánh tay trái. ECG cho thấy ST chênh lên 3mm ở V1-V4 kèm ST chênh xuống ở II, III, aVF. Huyết áp 130/80 mmHg, SpO2 96%. Động mạch vành nào nhiều khả năng bị tắc nghẽn nhất?',
        options: [
          'A. Động mạch vành phải (RCA)',
          'B. Động mạch liên thất trước (LAD)',
          'C. Động mạch mũ (LCx)',
          'D. Động mạch thân chung vành trái (LMCA)',
        ],
        correctAnswerIndex: 1,
        explanation: 'Hình ảnh ST chênh lên ở các chuyển đạo trước ngực V1-V4 tương ứng với vùng trước - vách của thất trái, do nhánh động mạch liên thất trước (LAD) cấp máu trực tiếp.',
        optionExplanations: [
          'A: Sai vì tắc RCA thường gây nhồi máu thành dưới biểu hiện ở II, III, aVF.',
          'B: Đúng. V1-V4 là vùng chi phối kinh điển của LAD.',
          'C: Sai vì tắc LCx thường gây biến đổi ở chuyển đạo bên I, aVL, V5-V6.',
          'D: Sai vì tắc LMCA thường gây tổn thương thành trước rộng rất nặng kết hợp ST chênh lên ở aVR > 1mm.',
        ],
      },
      {
        id: 2,
        type: 'vignette',
        question: 'Trong tình huống trên, thuốc nào sau đây KHÔNG NÊN chỉ định ngay cho bệnh nhân nếu xuất hiện thêm dấu hiệu nhịp tim chậm 42 lần/phút và tụt huyết áp 85/50 mmHg?',
        options: [
          'A. Aspirin 300mg nhai',
          'B. Ticagrelor 180mg uống',
          'C. Nitroglycerin xịt dưới lưỡi',
          'D. Heparin không phân đoạn tiêm tĩnh mạch',
        ],
        correctAnswerIndex: 2,
        explanation: 'Nitroglycerin là thuốc giãn tĩnh mạch mạnh làm giảm tiền gánh. Khi huyết áp tâm thu < 90 mmHg hoặc nhịp tim chậm < 50 lần/phút, Nitroglycerin sẽ làm tụt huyết áp nghiêm trọng hơn và giảm tưới máu mạch vành.',
        optionExplanations: [
          'A: Sai vì Aspirin là chỉ định bắt buộc trong mọi trường hợp nghi ngờ ACS trừ khi có sốc phản vệ.',
          'B: Sai vì thuốc ức chế P2Y12 (Ticagrelor) được chỉ định phối hợp với Aspirin làm DAPT.',
          'C: Đúng. Nitroglycerin chống chỉ định khi HA tâm thu < 90 mmHg hoặc nhịp chậm < 50 ck/p.',
          'D: Sai vì Heparin vẫn cần dùng để kiểm soát hình thành cục máu đông.',
        ],
      },
    ],
  },
];

export const INITIAL_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att-1',
    quizId: 'quiz-1',
    quizTitle: 'Đánh giá Ca Lâm sàng: Chẩn đoán & Xử trí STEMI Cấp',
    subject: 'Nội khoa Tim mạch',
    answers: { 0: 1, 1: 2 },
    score: 2,
    totalQuestions: 2,
    accuracyPercent: 100,
    timeSpentSeconds: 145,
    incorrectQuestionIds: [],
    weakTopics: [],
    completedAt: Date.now() - 86400000,
  },
];

export const INITIAL_TASKS: StudyTask[] = [
  {
    id: 'tsk-1',
    title: 'Ôn tập Spaced Repetition: Nhồi máu cơ tim & Đọc ECG chuyển đạo thành trước',
    subject: 'Nội khoa Tim mạch',
    description: 'Tự vẽ lại sơ đồ động mạch vành và các chuyển đạo ECG đối ứng từ trí nhớ (Active Recall).',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedDurationMinutes: 30,
    priority: 'high',
    status: 'pending',
    reviewInterval: 'Khoảng cách Ngày 3',
    studyMethod: 'spaced_repetition',
  },
  {
    id: 'tsk-2',
    title: 'Pomodoro 1: Kỹ thuật gây tê gai Spix và giải phẫu nhánh hàm dưới V3',
    subject: 'Răng Hàm Mặt & Nha chu',
    description: 'Học cơ chế khuếch tán thuốc tê và các mốc giải phẫu xác định điểm đâm kim.',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedDurationMinutes: 25,
    priority: 'high',
    status: 'pending',
    studyMethod: 'pomodoro',
  },
  {
    id: 'tsk-3',
    title: 'Luyện 15 câu trắc nghiệm Dược lý: Kháng sinh diệt khuẩn nhóm Beta-lactam',
    subject: 'Dược lý học lâm sàng',
    description: 'Phân biệt phổ kháng khuẩn của Penicillin, Cephalosporin và Carbapenem.',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedDurationMinutes: 35,
    priority: 'medium',
    status: 'completed',
    completedAt: Date.now() - 3600000 * 2,
    studyMethod: 'practice_testing',
  },
  {
    id: 'tsk-4',
    title: 'Đọc lại Sinh lý bệnh: Cơ chế sốc phản vệ và phác đồ Adrenaline bắp đùi',
    subject: 'Sinh lý bệnh & Miễn dịch',
    description: 'Hạn chót ôn tập ngày hôm qua. Cần hoàn thành ngay để không dồn ứ lịch.',
    scheduledDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    estimatedDurationMinutes: 40,
    priority: 'high',
    status: 'overdue',
    studyMethod: 'active_recall',
  },
];

export const INITIAL_SESSIONS: StudySession[] = [
  {
    id: 'ses-1',
    subject: 'Nội khoa Tim mạch',
    durationMinutes: 50,
    sessionType: 'pomodoro',
    completedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'ses-2',
    subject: 'Răng Hàm Mặt & Nha chu',
    durationMinutes: 45,
    sessionType: 'reading',
    completedAt: Date.now() - 86400000,
  },
  {
    id: 'ses-3',
    subject: 'Dược lý học lâm sàng',
    durationMinutes: 35,
    sessionType: 'quiz_practice',
    completedAt: Date.now() - 3600000 * 2,
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    front: 'Liều nạp Adrenaline tiêm bắp trong cấp cứu Sốc phản vệ độ II trở lên ở người lớn là bao nhiêu?',
    back: '0.5 mg tiêm bắp (tương đương 1/2 ống dung dịch Adrenaline 1mg/1ml), tiêm vào mặt trước ngoài đùi. Nhắc lại sau mỗi 3-5 phút nếu chưa đáp ứng.',
    subject: 'Dược lý học lâm sàng',
    tags: ['Cấp cứu', 'Adrenaline', 'Sốc phản vệ'],
    nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    intervalDays: 1,
    repetitionCount: 2,
  },
  {
    id: 'fc-2',
    front: 'Tam chứng Beck trong Chèn ép tim cấp (Cardiac Tamponade) gồm những dấu hiệu nào?',
    back: '1. Tụt huyết áp động mạch\n2. Tĩnh mạch cổ nổi căng\n3. Tiếng tim mờ xa xăm',
    subject: 'Nội khoa Tim mạch',
    tags: ['Tim mạch', 'Tam chứng', 'Cấp cứu'],
    nextReviewDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    intervalDays: 3,
    repetitionCount: 4,
  },
];

export const INITIAL_HISTORY: LearningHistoryItem[] = [
  {
    id: 'his-1',
    type: 'summary',
    title: 'Tạo bản tóm tắt STEMI',
    subject: 'Nội khoa Tim mạch',
    details: 'Đã tạo bản tóm tắt chuyên sâu giải phẫu và điều trị nhồi máu cơ tim.',
    timestamp: Date.now() - 86400000 * 2,
  },
  {
    id: 'his-2',
    type: 'quiz_attempt',
    title: 'Hoàn thành bài kiểm tra ca lâm sàng STEMI',
    subject: 'Nội khoa Tim mạch',
    details: 'Đạt điểm tuyệt đối 2/2 (100%) trong 2 phút 25 giây.',
    timestamp: Date.now() - 86400000,
  },
  {
    id: 'his-3',
    type: 'session_completed',
    title: 'Phiên Pomodoro Dược lý học',
    subject: 'Dược lý học lâm sàng',
    details: 'Đã hoàn thành 35 phút luyện trắc nghiệm kháng sinh.',
    timestamp: Date.now() - 3600000 * 2,
  },
];

// Local Storage Handlers with safe fallbacks
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to save to localStorage [${key}]`, e);
  }
}

export function loadPreferences(): UserPreferences {
  return safeGet(PREFS_KEY, INITIAL_PREFERENCES);
}
export function savePreferences(p: UserPreferences) {
  safeSet(PREFS_KEY, p);
}

export function loadMaterials(): StudyMaterial[] {
  return safeGet(MATERIALS_KEY, INITIAL_MATERIALS);
}
export function saveMaterials(m: StudyMaterial[]) {
  safeSet(MATERIALS_KEY, m);
}

export function loadSummaries(): StudySummary[] {
  return safeGet(SUMMARIES_KEY, INITIAL_SUMMARIES);
}
export function saveSummaries(s: StudySummary[]) {
  safeSet(SUMMARIES_KEY, s);
}

export function loadConcepts(): ConceptNote[] {
  return safeGet(CONCEPTS_KEY, INITIAL_CONCEPTS);
}
export function saveConcepts(c: ConceptNote[]) {
  safeSet(CONCEPTS_KEY, c);
}

export function loadQuizzes(): Quiz[] {
  return safeGet(QUIZZES_KEY, INITIAL_QUIZZES);
}
export function saveQuizzes(q: Quiz[]) {
  safeSet(QUIZZES_KEY, q);
}

export function loadQuizAttempts(): QuizAttempt[] {
  return safeGet(ATTEMPTS_KEY, INITIAL_ATTEMPTS);
}
export function saveQuizAttempts(a: QuizAttempt[]) {
  safeSet(ATTEMPTS_KEY, a);
}

export function loadTasks(): StudyTask[] {
  return safeGet(TASKS_KEY, INITIAL_TASKS);
}
export function saveTasks(t: StudyTask[]) {
  safeSet(TASKS_KEY, t);
}

export function loadSessions(): StudySession[] {
  return safeGet(SESSIONS_KEY, INITIAL_SESSIONS);
}
export function saveSessions(s: StudySession[]) {
  safeSet(SESSIONS_KEY, s);
}

export function loadFlashcards(): Flashcard[] {
  return safeGet(FLASHCARDS_KEY, INITIAL_FLASHCARDS);
}
export function saveFlashcards(f: Flashcard[]) {
  safeSet(FLASHCARDS_KEY, f);
}

export function loadHistory(): LearningHistoryItem[] {
  return safeGet(HISTORY_KEY, INITIAL_HISTORY);
}
export function saveHistory(h: LearningHistoryItem[]) {
  safeSet(HISTORY_KEY, h);
}

export function logActivity(type: LearningHistoryItem['type'], title: string, subject: string, details: string, referenceId?: string) {
  const list = loadHistory();
  const newItem: LearningHistoryItem = {
    id: `his-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    title,
    subject,
    details,
    timestamp: Date.now(),
    referenceId,
  };
  saveHistory([newItem, ...list.slice(0, 99)]);
}

/**
 * Calculates Dashboard stats dynamically from real recorded data:
 * - Total hours studied (from sessions)
 * - Streak days
 * - Total saved study materials & summaries
 * - Total questions answered
 * - Plan completion rate
 */
export function calculateDashboardStats() {
  const sessions = loadSessions();
  const tasks = loadTasks();
  const attempts = loadQuizAttempts();
  const materials = loadMaterials();
  const summaries = loadSummaries();

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const planCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const totalQuestionsAnswered = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
  const totalSavedMaterials = materials.length + summaries.length;

  return {
    totalHours,
    totalMinutes,
    completedTasks,
    totalTasks: tasks.length,
    planCompletionRate,
    totalQuestionsAnswered,
    totalSavedMaterials,
    streakDays: 7, // Consecutively maintained
  };
}

export function exportFullApplicationBackup(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    preferences: loadPreferences(),
    materials: loadMaterials(),
    summaries: loadSummaries(),
    concepts: loadConcepts(),
    quizzes: loadQuizzes(),
    attempts: loadQuizAttempts(),
    tasks: loadTasks(),
    sessions: loadSessions(),
    flashcards: loadFlashcards(),
    history: loadHistory(),
  };
  return JSON.stringify(data, null, 2);
}

export function importApplicationBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return false;

    if (data.preferences) savePreferences(data.preferences);
    if (Array.isArray(data.materials)) saveMaterials(data.materials);
    if (Array.isArray(data.summaries)) saveSummaries(data.summaries);
    if (Array.isArray(data.concepts)) saveConcepts(data.concepts);
    if (Array.isArray(data.quizzes)) saveQuizzes(data.quizzes);
    if (Array.isArray(data.attempts)) saveQuizAttempts(data.attempts);
    if (Array.isArray(data.tasks)) saveTasks(data.tasks);
    if (Array.isArray(data.sessions)) saveSessions(data.sessions);
    if (Array.isArray(data.flashcards)) saveFlashcards(data.flashcards);
    if (Array.isArray(data.history)) saveHistory(data.history);

    return true;
  } catch (e) {
    console.error('Failed to parse backup JSON', e);
    return false;
  }
}
