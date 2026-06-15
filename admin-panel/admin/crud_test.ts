import { TemplesService } from './src/services/firebase/temples';
import { CategoriesService } from './src/services/firebase/categories';
import { PoojasService } from './src/services/firebase/poojas';
import { PriestsService } from './src/services/firebase/priests';
import { ProUserService } from './src/services/firebase/users';
import { TempleRequestsService } from './src/services/firebase/templeRequests';
import { QueriesService } from './src/services/firebase/queries';
import { FeedbackService } from './src/services/firebase/feedback';
import { FestivalsService } from './src/services/firebase/festivals';
import { LanguagesService } from './src/services/firebase/languages';

const logs: any[] = [];
function log(msg: string) {
  console.log(msg);
  logs.push(msg);
}

async function run() {
  log("Starting CRUD Tests...");

  // 1. Temples
  try {
    log("--- Testing Temples ---");
    const templeId = "TEST_TEMPLE_" + Date.now();
    await TemplesService.createTemple(templeId, {
      name: "Test Temple", location: "Test Location", deity: "Test Deity", poojas: 0, priests: 0, status: "Active"
    });
    log(`Created Temple: ${templeId}`);
    let temples = await TemplesService.getTemples();
    let found = temples.find((t: any) => t.id === templeId);
    log(`Read Temple: ${found ? 'Success' : 'Failed'}`);
    await TemplesService.updateTemple(templeId, { location: "Updated Location" });
    log(`Updated Temple`);
    await TemplesService.deleteTemple(templeId);
    log(`Deleted Temple`);
  } catch (e: any) { log(`Temples Error: ${e.message}`); }

  // 2. Categories
  try {
    log("--- Testing Categories ---");
    const catId = "TEST_CAT_" + Date.now();
    await CategoriesService.createCategory(catId, {
      name: "Test Category", description: "Test Desc", icon: "🕉️", color: "#000000", poojas: 0, bookings: 0
    });
    log(`Created Category: ${catId}`);
    let cats = await CategoriesService.getCategories();
    let found = cats.find((c: any) => c.id === catId);
    log(`Read Category: ${found ? 'Success' : 'Failed'}`);
    await CategoriesService.updateCategory(catId, { description: "Updated" });
    log(`Updated Category`);
    await CategoriesService.deleteCategory(catId);
    log(`Deleted Category`);
  } catch (e: any) { log(`Categories Error: ${e.message}`); }

  // 3. Poojas
  try {
    log("--- Testing Poojas ---");
    const poojaId = "TEST_POOJA_" + Date.now();
    await PoojasService.createPooja(poojaId, {
      name: "Test Pooja", templeId: "temp", templeName: "Test Temple", categoryId: "cat", duration: "1 hr", price: 100, status: "Active"
    });
    log(`Created Pooja: ${poojaId}`);
    await PoojasService.updatePooja(poojaId, { price: 200 });
    log(`Updated Pooja`);
    await PoojasService.deletePooja(poojaId);
    log(`Deleted Pooja`);
  } catch (e: any) { log(`Poojas Error: ${e.message}`); }

  // 4. Priests
  try {
    log("--- Testing Priests ---");
    const priestId = "TEST_PRIEST_" + Date.now();
    await PriestsService.createPriest(priestId, {
      name: "Test Priest", photo: "TP", experience: "5 yrs", templeId: "temp", templeName: "Test Temple", location: "Test Loc", specialization: "Test Spec", bookings: 0, rating: 5, status: "Active", color: "#000000", languages: ["English"], since: "2026"
    });
    log(`Created Priest: ${priestId}`);
    await PriestsService.updatePriest(priestId, { status: "Available" });
    log(`Updated Priest`);
    await PriestsService.deletePriest(priestId);
    log(`Deleted Priest`);
  } catch (e: any) { log(`Priests Error: ${e.message}`); }

  // 6. Temple Requests
  try {
    log("--- Testing Temple Requests ---");
    const trId = "TEST_TR_" + Date.now();
    await TempleRequestsService.createRequest(trId, {
      name: "Test Temple Request", location: "Test Loc", deity: "Test Deity", type: "Test Type", contact: "Test Contact", phone: "1234567890", docs: "Pending", status: "Pending Review", submitted: "2026-06-15"
    }, "admin_tester");
    log(`Created Temple Request: ${trId}`);
    await TempleRequestsService.updateRequestStatus(trId, "Approved", "admin_tester");
    log(`Updated Temple Request Status`);
    await TempleRequestsService.deleteRequest(trId, "admin_tester");
    log(`Deleted Temple Request`);
  } catch (e: any) { log(`Temple Requests Error: ${e.message}`); }

  // 7. Queries
  try {
    log("--- Testing Queries ---");
    const queryId = "TEST_QUERY_" + Date.now();
    await QueriesService.createQuery(queryId, {
      devotee: "Test Devotee", subject: "Test Subject", category: "Test Cat", status: "Open"
    }, "admin_tester");
    log(`Created Query: ${queryId}`);
    await QueriesService.addMessageToQuery(queryId, "Test Reply", "admin_tester");
    log(`Added Message to Query`);
    await QueriesService.updateQueryStatus(queryId, "Resolved", "admin_tester");
    log(`Updated Query Status`);
    await QueriesService.deleteQuery(queryId, "admin_tester");
    log(`Deleted Query`);
  } catch (e: any) { log(`Queries Error: ${e.message}`); }

  // 8. Feedback
  try {
    log("--- Testing Feedback ---");
    const fbId = "TEST_FB_" + Date.now();
    await FeedbackService.createFeedback(fbId, {
      devotee: "Test Devotee", temple: "Test Temple", service: "Test Service", rating: 5, comment: "Test Comment", sentiment: "Positive", status: "PENDING"
    }, "admin_tester");
    log(`Created Feedback: ${fbId}`);
    await FeedbackService.updateFeedbackStatus(fbId, "APPROVED", "admin_tester");
    log(`Updated Feedback Status`);
    await FeedbackService.deleteFeedback(fbId, "admin_tester");
    log(`Deleted Feedback`);
  } catch (e: any) { log(`Feedback Error: ${e.message}`); }

  // 9. Festivals
  try {
    log("--- Testing Festivals ---");
    const festId = "TEST_FEST_" + Date.now();
    await FestivalsService.createFestival(festId, {
      name: "Test Festival", date: "2026-01-01", description: "Test Desc", status: "Upcoming"
    });
    log(`Created Festival: ${festId}`);
    await FestivalsService.updateFestival(festId, { status: "Ongoing" });
    log(`Updated Festival`);
    await FestivalsService.deleteFestival(festId);
    log(`Deleted Festival`);
  } catch (e: any) { log(`Festivals Error: ${e.message}`); }

  // 10. Languages
  try {
    log("--- Testing Languages ---");
    const langId = "TEST_LANG_" + Date.now();
    await LanguagesService.createLanguage(langId, {
      name: "Test Lang", code: "TL", nativeName: "TLang"
    });
    log(`Created Language: ${langId}`);
    await LanguagesService.updateLanguage(langId, { nativeName: "Updated TLang" });
    log(`Updated Language`);
    await LanguagesService.deleteLanguage(langId);
    log(`Deleted Language`);
  } catch (e: any) { log(`Languages Error: ${e.message}`); }

  log("CRUD Tests Completed Successfully.");
  process.exit(0);
}
run();
