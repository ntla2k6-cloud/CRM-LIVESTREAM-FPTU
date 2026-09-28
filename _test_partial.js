// ── STATE ──
let students      = [];
let classes       = [];
let customCourses = [];
let customPrices  = {};
let staffRoles    = [];
let staff         = [];
let attendance    = [];
let leads         = [];
let expenses      = [];
let makeups       = [];
let templates     = [];
let editStudentId = null;
let editStaffId   = null;
let editLeadId    = null;
let editMakeupId  = null;
let editTemplateId= null;
let studentFilter = 'all';
let studentClassFilter = 'all';
let studentSubjectFilter = 'all';
let staffFilter   = 'all';
let leadFilter    = 'all';
let makeupFilter  = 'all';
let consultTab    = 'process';


// ── STATIC COURSE LIST FOR FILTER TABS ──
const STATIC_COURSES = [
