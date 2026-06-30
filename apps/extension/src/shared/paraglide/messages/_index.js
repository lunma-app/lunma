/* eslint-disable */
import { getLocale, experimentalStaticLocale } from "../runtime.js"

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Sidebar_Openlauncher1Inputs */
/** @typedef {{}} Sidebar_Newfolder1Inputs */
/** @typedef {{}} Sidebar_Newlens1Inputs */
/** @typedef {{}} Sidebar_Editspace1Inputs */
/** @typedef {{}} Sidebar_Newspace1Inputs */
/** @typedef {{}} Sidebar_Closealltemptabs3Inputs */
/** @typedef {{}} Sidebar_Newtab1Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Clearedtabs1Inputs */
/** @typedef {{}} Sidebar_Lensnoentriesyet3Inputs */
/** @typedef {{}} Sidebar_Lensallcaughtup3Inputs */
/** @typedef {{}} Sidebar_Lensnothinghere2Inputs */
/** @typedef {{}} Sidebar_Lensrefresh1Inputs */
/** @typedef {{}} Sidebar_Lensedit1Inputs */
/** @typedef {{}} Sidebar_Lensopenaspage3Inputs */
/** @typedef {{}} Sidebar_Lensopenall2Inputs */
/** @typedef {{}} Sidebar_Lensmarkallread3Inputs */
/** @typedef {{}} Sidebar_Lensmoveup2Inputs */
/** @typedef {{}} Sidebar_Lensmovedown2Inputs */
/** @typedef {{}} Sidebar_Lensdelete1Inputs */
/** @typedef {{}} Sidebar_Lensdeleteconfirm2Inputs */
/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Lensopenpagelabel3Inputs */
/** @typedef {{ name: NonNullable<unknown>, badge: NonNullable<unknown>, kind: NonNullable<unknown> }} Sidebar_Lensopenpagelabelbadge4Inputs */
/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lenssigninto3Inputs */
/** @typedef {{}} Sidebar_Lensaddtoken2Inputs */
/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lensreconnect1Inputs */
/** @typedef {{}} Sidebar_Lenstokenerror2Inputs */
/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lensneedsaccess2Inputs */
/** @typedef {{}} Sidebar_Lensclose1Inputs */
/** @typedef {{}} Sidebar_Lensdismiss1Inputs */
/** @typedef {{}} Sidebar_Lensfiltered1Inputs */
/** @typedef {{ host: NonNullable<unknown> }} Sidebar_Lenscouldnotreach3Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Lensshowread2Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Lenshideread2Inputs */
/** @typedef {{}} Sidebar_Lensopenallfeed3Inputs */
/** @typedef {{}} Sidebar_Lensaccountremoved2Inputs */
/** @typedef {{}} Sidebar_Editlenssheet2Inputs */
/** @typedef {{}} Sidebar_Gohome1Inputs */
/** @typedef {{}} Sidebar_Makethishome2Inputs */
/** @typedef {{}} Sidebar_Tabrename1Inputs */
/** @typedef {{}} Sidebar_Tabresetname2Inputs */
/** @typedef {{}} Sidebar_Tablocktosite3Inputs */
/** @typedef {{}} Sidebar_Tabmoveup2Inputs */
/** @typedef {{}} Sidebar_Tabmovedown2Inputs */
/** @typedef {{}} Sidebar_Tabunpin1Inputs */
/** @typedef {{}} Sidebar_Tabdelete1Inputs */
/** @typedef {{}} Sidebar_Tabdeleteconfirm2Inputs */
/** @typedef {{}} Sidebar_Closetablabel2Inputs */
/** @typedef {{}} Sidebar_Nopinnedtabs2Inputs */
/** @typedef {{ modifier: NonNullable<unknown> }} Sidebar_Dragtabstopinhint4Inputs */
/** @typedef {{}} Sidebar_Emptyfolderhint2Inputs */
/** @typedef {{}} Sidebar_Locktositetitle3Inputs */
/** @typedef {{}} Sidebar_Spaceeditortitlenew3Inputs */
/** @typedef {{}} Sidebar_Spaceeditortitleedit3Inputs */
/** @typedef {{}} Sidebar_Spacename1Inputs */
/** @typedef {{}} Sidebar_Spacenameplaceholder2Inputs */
/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spaceduplicate1Inputs */
/** @typedef {{}} Sidebar_Spacecolor1Inputs */
/** @typedef {{}} Sidebar_Spaceicon1Inputs */
/** @typedef {{}} Sidebar_Spaceautoarchive2Inputs */
/** @typedef {{}} Sidebar_Autoarchivecreatehelp3Inputs */
/** @typedef {{}} Sidebar_Autoarchiveedithelp3Inputs */
/** @typedef {{}} Sidebar_Autoarchivemodeinherit3Inputs */
/** @typedef {{}} Sidebar_Autoarchivemodeoff3Inputs */
/** @typedef {{}} Sidebar_Autoarchivemodecustom3Inputs */
/** @typedef {{}} Sidebar_Archiveafterlabel2Inputs */
/** @typedef {{}} Sidebar_Minutesidlelabel2Inputs */
/** @typedef {{}} Sidebar_Deletespaceconfirm2Inputs */
/** @typedef {{}} Sidebar_Deletespacebutton2Inputs */
/** @typedef {{}} Sidebar_Spaceeditorconfirmcreate3Inputs */
/** @typedef {{}} Sidebar_Spaceeditorconfirmsave3Inputs */
/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spacetooltipedit2Inputs */
/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spacetooltipactivate2Inputs */
/** @typedef {{}} Sidebar_Addspace1Inputs */
/** @typedef {{}} Sidebar_Openoptions1Inputs */
/** @typedef {{}} Sidebar_Tempfavorite1Inputs */
/** @typedef {{}} Sidebar_Temprename1Inputs */
/** @typedef {{}} Sidebar_Tempmoveup2Inputs */
/** @typedef {{}} Sidebar_Tempmovedown2Inputs */
/** @typedef {{}} Sidebar_Tempduplicate1Inputs */
/** @typedef {{}} Sidebar_Tempclosetab2Inputs */
/** @typedef {{}} Sidebar_Archivedtooltip1Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Sidebar_Archivedlabel1Inputs */
/** @typedef {{}} Sidebar_Autoarchiveison3Inputs */
/** @typedef {{ threshold: NonNullable<unknown> }} Sidebar_Autoarchiveexplain2Inputs */
/** @typedef {{}} Sidebar_Autoarchivedismiss2Inputs */
/** @typedef {{}} Sidebar_Autoarchivemanage2Inputs */
/** @typedef {{}} Launcher_Emptycaption1Inputs */
/** @typedef {{ tabCount: NonNullable<unknown>, pinnedCount: NonNullable<unknown> }} Launcher_Metaline1Inputs */
/** @typedef {{}} Launcher_PlaceholderInputs */
/** @typedef {{}} Launcher_Arialabel1Inputs */
/** @typedef {{ engine: NonNullable<unknown>, query: NonNullable<unknown> }} Launcher_Enginerowtitle2Inputs */
/** @typedef {{}} Launcher_Enginehintsearch2Inputs */
/** @typedef {{}} Launcher_Enginehintcycle2Inputs */
/** @typedef {{}} Launcher_Enginehintswitch2Inputs */
/** @typedef {{}} Launcher_Nomatches1Inputs */
/** @typedef {{}} Launcher_Actionhintopen2Inputs */
/** @typedef {{}} Launcher_Actionhintswitch2Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Launcher_Resultstatus1Inputs */
/** @typedef {{}} Launcher_Enablehistory1Inputs */
/** @typedef {{}} Launcher_Enablebookmarks1Inputs */
/** @typedef {{}} Launcher_Lensnoconnections2Inputs */
/** @typedef {{}} Launcher_Lensfeedssubtitle2Inputs */
/** @typedef {{}} Launcher_Lensmissingtitle2Inputs */
/** @typedef {{}} Launcher_Lensmissingcopy2Inputs */
/** @typedef {{}} Launcher_Overlay_PlaceholderInputs */
/** @typedef {{}} Launcher_Overlay_Arialabel1Inputs */
/** @typedef {{}} Launcher_Overlay_Dialoglabel1Inputs */
/** @typedef {{ engine: NonNullable<unknown> }} Launcher_Overlay_Exitengine1Inputs */
/** @typedef {{}} Launcher_Overlay_Tabhintsearch2Inputs */
/** @typedef {{}} Launcher_Overlay_Tabhintcycle2Inputs */
/** @typedef {{}} Launcher_Overlay_Tabhintswitch2Inputs */
/** @typedef {{}} Launcher_Overlay_Nomatches1Inputs */
/** @typedef {{}} Launcher_Overlay_Alreadyopen1Inputs */
/** @typedef {{}} Launcher_Overlay_SwitchInputs */
/** @typedef {{}} Launcher_Overlay_Newtab1Inputs */
/** @typedef {{}} Launcher_Overlay_OpenInputs */
/** @typedef {{}} Launcher_Overlay_Enablehistory1Inputs */
/** @typedef {{}} Launcher_Overlay_Enablebookmarks1Inputs */
/** @typedef {{}} Options_Searchgroupintro2Inputs */
/** @typedef {{}} Options_Appearancegroupintro2Inputs */
/** @typedef {{}} Options_Tabsgroupintro2Inputs */
/** @typedef {{}} Options_Autoarchivegroupintro3Inputs */
/** @typedef {{}} Options_Privacylink1Inputs */
/** @typedef {{}} Options_Customurlhint2Inputs */
/** @typedef {{ keyword: NonNullable<unknown> }} Options_Customkeywordcollision2Inputs */
/** @typedef {{}} Options_Backupdescription1Inputs */
/** @typedef {{}} Options_Includesettingsdescription2Inputs */
/** @typedef {{}} Options_Exportbackup1Inputs */
/** @typedef {{}} Options_Importconfirm1Inputs */
/** @typedef {{}} Options_Importcancel1Inputs */
/** @typedef {{}} Options_Importrestore1Inputs */
/** @typedef {{}} Options_Importbackup1Inputs */
/** @typedef {{}} Options_Backupexported1Inputs */
/** @typedef {{}} Options_Backuprestored1Inputs */
/** @typedef {{}} Options_Importreaderror2Inputs */
/** @typedef {{}} Options_Importinvaliderror2Inputs */
/** @typedef {{}} Options_Importfailederror2Inputs */
/** @typedef {{}} Options_Connectionsdescription1Inputs */
/** @typedef {{}} Options_Accountsmetadescription2Inputs */
/** @typedef {{}} Options_Noaccounts1Inputs */
/** @typedef {{}} Options_Accountreplacetoken2Inputs */
/** @typedef {{}} Options_Accountaddtoken2Inputs */
/** @typedef {{}} Options_Accountrename1Inputs */
/** @typedef {{}} Options_Accountdisconnect1Inputs */
/** @typedef {{}} Options_Feedrename1Inputs */
/** @typedef {{}} Options_Feedcopyurl2Inputs */
/** @typedef {{}} Options_Feedremove1Inputs */
/** @typedef {{}} Options_Feedsgrouptitle2Inputs */
/** @typedef {{}} Options_Exportopml1Inputs */
/** @typedef {{}} Options_Nofeeds1Inputs */
/** @typedef {{}} Options_Connecttoggleconnect2Inputs */
/** @typedef {{}} Options_Connecttoggleclose2Inputs */
/** @typedef {{}} Options_Feedurlcopied2Inputs */
/** @typedef {{}} Options_Reachnotused2Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Options_Reachused1Inputs */
/** @typedef {{}} Options_Authmethodpersonaltoken3Inputs */
/** @typedef {{}} Options_Authmethodbrowsersession3Inputs */
/** @typedef {{}} Options_Authmethodtokenneeded3Inputs */
/** @typedef {{}} Options_Authmethodsigninneeded4Inputs */
/** @typedef {{}} Options_Authmethodpublic2Inputs */
/** @typedef {{}} Options_Resultsourcesheading2Inputs */
/** @typedef {{}} Options_Resultsourcesdescription2Inputs */
/** @typedef {{}} Options_Resultsourcesintro2Inputs */
/** @typedef {{}} Options_Historylabel1Inputs */
/** @typedef {{}} Options_Historydescription1Inputs */
/** @typedef {{}} Options_Enablehistory1Inputs */
/** @typedef {{}} Options_Bookmarkslabel1Inputs */
/** @typedef {{}} Options_Bookmarksdescription1Inputs */
/** @typedef {{}} Options_Enablebookmarks1Inputs */
/** @typedef {{}} Options_Sourceenabled1Inputs */
/** @typedef {{ label: NonNullable<unknown> }} Options_Sourceenabledtoast2Inputs */
/** @typedef {{}} Options_Recentlyarchivedheading2Inputs */
/** @typedef {{}} Options_Recentlyarchiveddescription2Inputs */
/** @typedef {{}} Options_Cleararchivedconfirm2Inputs */
/** @typedef {{}} Options_Cleararchivedcancel2Inputs */
/** @typedef {{}} Options_Cleararchiveddelete2Inputs */
/** @typedef {{}} Options_Cleararchived1Inputs */
/** @typedef {{}} Options_Archivedempty1Inputs */
/** @typedef {{ title: NonNullable<unknown> }} Options_Restorearchivedlabel2Inputs */
/** @typedef {{}} Options_Restorearchivedtitle2Inputs */
/** @typedef {{ title: NonNullable<unknown> }} Options_Deletearchivedlabel2Inputs */
/** @typedef {{}} Options_Deletearchivedtitle2Inputs */
/** @typedef {{}} Options_Shortcuttitle1Inputs */
/** @typedef {{ modifier: NonNullable<unknown> }} Options_Shortcutdescription1Inputs */
/** @typedef {{}} Options_Openshortcuts1Inputs */
/** @typedef {{}} Options_Grouplabel_Search1Inputs */
/** @typedef {{}} Options_Grouplabel_Appearance1Inputs */
/** @typedef {{}} Options_Grouplabel_Tabs1Inputs */
/** @typedef {{}} Options_Grouplabel_Autoarchive2Inputs */
/** @typedef {{}} Options_Label_LanguageInputs */
/** @typedef {{}} Options_Desc_LanguageInputs */
/** @typedef {{}} Options_Label_Defaultsearchengine2Inputs */
/** @typedef {{}} Options_Desc_Defaultsearchengine2Inputs */
/** @typedef {{}} Options_Label_Customsearchurl2Inputs */
/** @typedef {{}} Options_Desc_Customsearchurl2Inputs */
/** @typedef {{}} Options_Label_Customsearchkeyword2Inputs */
/** @typedef {{}} Options_Desc_Customsearchkeyword2Inputs */
/** @typedef {{}} Options_Label_Launcherscope1Inputs */
/** @typedef {{}} Options_Desc_Launcherscope1Inputs */
/** @typedef {{}} Options_Label_DensityInputs */
/** @typedef {{}} Options_Desc_DensityInputs */
/** @typedef {{}} Options_Label_TintInputs */
/** @typedef {{}} Options_Desc_TintInputs */
/** @typedef {{}} Options_Label_ThemeInputs */
/** @typedef {{}} Options_Desc_ThemeInputs */
/** @typedef {{}} Options_Label_Showglares1Inputs */
/** @typedef {{}} Options_Desc_Showglares1Inputs */
/** @typedef {{}} Options_Label_Reducemotion1Inputs */
/** @typedef {{}} Options_Desc_Reducemotion1Inputs */
/** @typedef {{}} Options_Label_Dedupnewtabnavigations3Inputs */
/** @typedef {{}} Options_Desc_Dedupnewtabnavigations3Inputs */
/** @typedef {{}} Options_Label_Pinnedtabboundarydefault3Inputs */
/** @typedef {{}} Options_Desc_Pinnedtabboundarydefault3Inputs */
/** @typedef {{}} Options_Label_Autoarchiveenabled2Inputs */
/** @typedef {{}} Options_Desc_Autoarchiveenabled2Inputs */
/** @typedef {{}} Options_Label_Autoarchiveidleminutes3Inputs */
/** @typedef {{}} Options_Desc_Autoarchiveidleminutes3Inputs */
/** @typedef {{}} Options_Label_Autoarchiveretentiondays3Inputs */
/** @typedef {{}} Options_Desc_Autoarchiveretentiondays3Inputs */
/** @typedef {{}} Options_Pagesubtitle1Inputs */
/** @typedef {{ version: NonNullable<unknown> }} Options_VersionInputs */
/** @typedef {{}} Common_CancelInputs */
/** @typedef {{}} Common_SaveInputs */
/** @typedef {{}} Common_AddInputs */
/** @typedef {{}} Common_DeleteInputs */
/** @typedef {{}} Common_NameInputs */
/** @typedef {{}} Common_RefreshInputs */
/** @typedef {{}} Common_ManageInputs */
/** @typedef {{}} Common_Selectall1Inputs */
/** @typedef {{}} Common_Deselectall1Inputs */
/** @typedef {{}} Entity_ChangesInputs */
/** @typedef {{}} Entity_IssuesInputs */
/** @typedef {{}} Entity_ArticlesInputs */
/** @typedef {{}} Entity_OtherInputs */
/** @typedef {{}} Sidebar_Searchplaceholder1Inputs */
/** @typedef {{}} Sidebar_Clearsearch1Inputs */
/** @typedef {{}} Sidebar_Nofavorites1Inputs */
/** @typedef {{}} Sidebar_Lensgrantaccess2Inputs */
/** @typedef {{}} Sidebar_Lensfilteredbadge2Inputs */
/** @typedef {{}} Sidebar_Lensopenfeedsite3Inputs */
/** @typedef {{}} Sidebar_Lensreadfrom2Inputs */
/** @typedef {{}} Sidebar_Lensreadfromhelp3Inputs */
/** @typedef {{}} Sidebar_Lenssourcesearch2Inputs */
/** @typedef {{}} Sidebar_Lensnameplaceholder2Inputs */
/** @typedef {{}} Sidebar_Lensfilterslabel2Inputs */
/** @typedef {{}} Sidebar_Lensconnectservice2Inputs */
/** @typedef {{}} Sidebar_Lenswillshow2Inputs */
/** @typedef {{}} Sidebar_Spacecolorlabel2Inputs */
/** @typedef {{}} Sidebar_Boundarychangedefault2Inputs */
/** @typedef {{}} Sidebar_Boundaryfree1Inputs */
/** @typedef {{}} Sidebar_Boundarypagehelp2Inputs */
/** @typedef {{}} Sidebar_Boundarypageslabel2Inputs */
/** @typedef {{}} Launcher_Lensclearfilter2Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Launcher_Lensunread1Inputs */
/** @typedef {{}} Launcher_Lensarticlelayout2Inputs */
/** @typedef {{}} Launcher_Lensgrid1Inputs */
/** @typedef {{}} Launcher_Lenslist1Inputs */
/** @typedef {{}} Launcher_Lensempty1Inputs */
/** @typedef {{}} Launcher_Lenswaitingonyou3Inputs */
/** @typedef {{}} Launcher_Lensreasonreview2Inputs */
/** @typedef {{}} Launcher_Lensreasonci2Inputs */
/** @typedef {{}} Launcher_Lensreasonassigned2Inputs */
/** @typedef {{}} Launcher_Lensunassigned1Inputs */
/** @typedef {{}} Options_Accountsgrouptitle2Inputs */
/** @typedef {{}} Options_Connectionsheading1Inputs */
/** @typedef {{}} Options_Backupheading1Inputs */
/** @typedef {{}} Options_Feedsexported1Inputs */
/** @typedef {{ reach: NonNullable<unknown>, entity: NonNullable<unknown> }} Options_Accountreachline2Inputs */
/** @typedef {{ feedUrl: NonNullable<unknown>, reach: NonNullable<unknown>, entity: NonNullable<unknown> }} Options_Feedreachline2Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Options_Removeconfirmwarn2Inputs */
/** @typedef {{}} Launcher_Lensfilterbyrepo3Inputs */
/** @typedef {{}} Launcher_Lensfilterbyproject3Inputs */
/** @typedef {{}} Launcher_Lensfilterbyfeed3Inputs */
/** @typedef {{}} Options_Includesettingslabel2Inputs */
/** @typedef {{}} Sidebar_Favoriteactions1Inputs */
/** @typedef {{}} Sidebar_Smartfolderactions2Inputs */
/** @typedef {{}} Sidebar_Lensmaxitems2Inputs */
/** @typedef {{}} Sidebar_Lensrefreshcadence2Inputs */
/** @typedef {{}} Sidebar_Tabactions1Inputs */
/** @typedef {{}} Sidebar_Openoptionsaria2Inputs */
/** @typedef {{}} Sidebar_Boundaryaddpattern2Inputs */
/** @typedef {{}} Sidebar_Boundaryurlplaceholder2Inputs */
/** @typedef {{}} Sidebar_Idleminutesaria2Inputs */
/** @typedef {{}} Launcher_Lensallrepos2Inputs */
/** @typedef {{}} Launcher_Lensallprojects2Inputs */
/** @typedef {{}} Launcher_Lensallfeeds2Inputs */
/** @typedef {{ count: NonNullable<unknown> }} Launcher_Lensscopeselected2Inputs */
/** @typedef {{}} Launcher_Lensscopesearch2Inputs */
/** @typedef {{}} Sidebar_Lensroleauthored2Inputs */
/** @typedef {{}} Sidebar_Lensroleassigned2Inputs */
/** @typedef {{}} Sidebar_Copylink1Inputs */
/** @typedef {{}} Sidebar_Moveleft1Inputs */
/** @typedef {{}} Sidebar_Moveright1Inputs */
/** @typedef {{}} Sidebar_Removefromfavorites2Inputs */
/** @typedef {{}} Sidebar_Lenscadence51Inputs */
/** @typedef {{}} Sidebar_Lenscadence101Inputs */
/** @typedef {{}} Sidebar_Lenscadence301Inputs */
/** @typedef {{}} Sidebar_Lenscadencehour2Inputs */
/** @typedef {{}} Sidebar_Boundarymodedefault2Inputs */
/** @typedef {{}} Sidebar_Boundarymodeoff2Inputs */
/** @typedef {{}} Sidebar_Boundarymodeon2Inputs */
/** @typedef {{}} Options_Language_SystemInputs */
/** @typedef {{}} Options_Engine_CustomInputs */
/** @typedef {{}} Options_Scope_GlobalInputs */
/** @typedef {{}} Options_Scope_Prefercurrent1Inputs */
/** @typedef {{}} Options_Scope_Currentonly1Inputs */
/** @typedef {{}} Options_Density_CompactInputs */
/** @typedef {{}} Options_Density_NormalInputs */
/** @typedef {{}} Options_Density_ComfortInputs */
/** @typedef {{}} Options_Tint_SubtleInputs */
/** @typedef {{}} Options_Tint_StandardInputs */
/** @typedef {{}} Options_Tint_VividInputs */
/** @typedef {{}} Options_Theme_DarkInputs */
/** @typedef {{}} Options_Theme_LightInputs */
/** @typedef {{}} Options_Boundary_OffInputs */
/** @typedef {{}} Options_Boundary_DomainInputs */
/** @typedef {{}} Options_Boundary_PageInputs */
/** @typedef {{}} Options_Toggle_OffInputs */
/** @typedef {{}} Options_Toggle_OnInputs */
/** @typedef {{}} Sidebar_Lenskindunread2Inputs */
/** @typedef {{}} Sidebar_Lenskinditems2Inputs */
/** @typedef {{}} Sidebar_Lenseditorcreate2Inputs */
/** @typedef {{}} Sidebar_Lensrolewatching2Inputs */
/** @typedef {{}} Sidebar_Lensrolereviewing2Inputs */
/** @typedef {{ name: NonNullable<unknown> }} Sidebar_Spaceeditaria2Inputs */
/** @typedef {{}} Sidebar_Favdrophint2Inputs */
/** @typedef {{}} Sidebar_Favdraghint2Inputs */
import * as __en from "./en.js"
import * as __es from "./es.js"
import * as __pt_pt2 from "./pt-PT.js"
import * as __fr from "./fr.js"
import * as __de from "./de.js"
import * as __ja from "./ja.js"
import * as __ko from "./ko.js"
import * as __zh_cn2 from "./zh-CN.js"
import * as __ru from "./ru.js"
/**
* | output |
* | --- |
* | "Open launcher" |
*
* @param {Sidebar_Openlauncher1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_openlauncher1 = /** @type {((inputs?: Sidebar_Openlauncher1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Openlauncher1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_openlauncher1(inputs)
	if (locale === "es") return __es.sidebar_openlauncher1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_openlauncher1(inputs)
	if (locale === "fr") return __fr.sidebar_openlauncher1(inputs)
	if (locale === "de") return __de.sidebar_openlauncher1(inputs)
	if (locale === "ja") return __ja.sidebar_openlauncher1(inputs)
	if (locale === "ko") return __ko.sidebar_openlauncher1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_openlauncher1(inputs)
	return __ru.sidebar_openlauncher1(inputs)
});
export { sidebar_openlauncher1 as "sidebar_openLauncher" }
/**
* | output |
* | --- |
* | "New folder" |
*
* @param {Sidebar_Newfolder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_newfolder1 = /** @type {((inputs?: Sidebar_Newfolder1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Newfolder1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_newfolder1(inputs)
	if (locale === "es") return __es.sidebar_newfolder1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_newfolder1(inputs)
	if (locale === "fr") return __fr.sidebar_newfolder1(inputs)
	if (locale === "de") return __de.sidebar_newfolder1(inputs)
	if (locale === "ja") return __ja.sidebar_newfolder1(inputs)
	if (locale === "ko") return __ko.sidebar_newfolder1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_newfolder1(inputs)
	return __ru.sidebar_newfolder1(inputs)
});
export { sidebar_newfolder1 as "sidebar_newFolder" }
/**
* | output |
* | --- |
* | "New lens…" |
*
* @param {Sidebar_Newlens1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_newlens1 = /** @type {((inputs?: Sidebar_Newlens1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Newlens1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_newlens1(inputs)
	if (locale === "es") return __es.sidebar_newlens1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_newlens1(inputs)
	if (locale === "fr") return __fr.sidebar_newlens1(inputs)
	if (locale === "de") return __de.sidebar_newlens1(inputs)
	if (locale === "ja") return __ja.sidebar_newlens1(inputs)
	if (locale === "ko") return __ko.sidebar_newlens1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_newlens1(inputs)
	return __ru.sidebar_newlens1(inputs)
});
export { sidebar_newlens1 as "sidebar_newLens" }
/**
* | output |
* | --- |
* | "Edit Space…" |
*
* @param {Sidebar_Editspace1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_editspace1 = /** @type {((inputs?: Sidebar_Editspace1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Editspace1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_editspace1(inputs)
	if (locale === "es") return __es.sidebar_editspace1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_editspace1(inputs)
	if (locale === "fr") return __fr.sidebar_editspace1(inputs)
	if (locale === "de") return __de.sidebar_editspace1(inputs)
	if (locale === "ja") return __ja.sidebar_editspace1(inputs)
	if (locale === "ko") return __ko.sidebar_editspace1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_editspace1(inputs)
	return __ru.sidebar_editspace1(inputs)
});
export { sidebar_editspace1 as "sidebar_editSpace" }
/**
* | output |
* | --- |
* | "New Space…" |
*
* @param {Sidebar_Newspace1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_newspace1 = /** @type {((inputs?: Sidebar_Newspace1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Newspace1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_newspace1(inputs)
	if (locale === "es") return __es.sidebar_newspace1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_newspace1(inputs)
	if (locale === "fr") return __fr.sidebar_newspace1(inputs)
	if (locale === "de") return __de.sidebar_newspace1(inputs)
	if (locale === "ja") return __ja.sidebar_newspace1(inputs)
	if (locale === "ko") return __ko.sidebar_newspace1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_newspace1(inputs)
	return __ru.sidebar_newspace1(inputs)
});
export { sidebar_newspace1 as "sidebar_newSpace" }
/**
* | output |
* | --- |
* | "Close all temporary tabs" |
*
* @param {Sidebar_Closealltemptabs3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_closealltemptabs3 = /** @type {((inputs?: Sidebar_Closealltemptabs3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Closealltemptabs3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_closealltemptabs3(inputs)
	if (locale === "es") return __es.sidebar_closealltemptabs3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_closealltemptabs3(inputs)
	if (locale === "fr") return __fr.sidebar_closealltemptabs3(inputs)
	if (locale === "de") return __de.sidebar_closealltemptabs3(inputs)
	if (locale === "ja") return __ja.sidebar_closealltemptabs3(inputs)
	if (locale === "ko") return __ko.sidebar_closealltemptabs3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_closealltemptabs3(inputs)
	return __ru.sidebar_closealltemptabs3(inputs)
});
export { sidebar_closealltemptabs3 as "sidebar_closeAllTempTabs" }
/**
* | output |
* | --- |
* | "New Tab" |
*
* @param {Sidebar_Newtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_newtab1 = /** @type {((inputs?: Sidebar_Newtab1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Newtab1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_newtab1(inputs)
	if (locale === "es") return __es.sidebar_newtab1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_newtab1(inputs)
	if (locale === "fr") return __fr.sidebar_newtab1(inputs)
	if (locale === "de") return __de.sidebar_newtab1(inputs)
	if (locale === "ja") return __ja.sidebar_newtab1(inputs)
	if (locale === "ko") return __ko.sidebar_newtab1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_newtab1(inputs)
	return __ru.sidebar_newtab1(inputs)
});
export { sidebar_newtab1 as "sidebar_newTab" }
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Cleared {count} tab" |
* | "other" | "Cleared {count} tabs" |
*
* @param {Sidebar_Clearedtabs1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_clearedtabs1 = /** @type {((inputs: Sidebar_Clearedtabs1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Clearedtabs1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_clearedtabs1(inputs)
	if (locale === "es") return __es.sidebar_clearedtabs1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_clearedtabs1(inputs)
	if (locale === "fr") return __fr.sidebar_clearedtabs1(inputs)
	if (locale === "de") return __de.sidebar_clearedtabs1(inputs)
	if (locale === "ja") return __ja.sidebar_clearedtabs1(inputs)
	if (locale === "ko") return __ko.sidebar_clearedtabs1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_clearedtabs1(inputs)
	return __ru.sidebar_clearedtabs1(inputs)
});
export { sidebar_clearedtabs1 as "sidebar_clearedTabs" }
/**
* | output |
* | --- |
* | "No entries yet." |
*
* @param {Sidebar_Lensnoentriesyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensnoentriesyet3 = /** @type {((inputs?: Sidebar_Lensnoentriesyet3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensnoentriesyet3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensnoentriesyet3(inputs)
	if (locale === "es") return __es.sidebar_lensnoentriesyet3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensnoentriesyet3(inputs)
	if (locale === "fr") return __fr.sidebar_lensnoentriesyet3(inputs)
	if (locale === "de") return __de.sidebar_lensnoentriesyet3(inputs)
	if (locale === "ja") return __ja.sidebar_lensnoentriesyet3(inputs)
	if (locale === "ko") return __ko.sidebar_lensnoentriesyet3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensnoentriesyet3(inputs)
	return __ru.sidebar_lensnoentriesyet3(inputs)
});
export { sidebar_lensnoentriesyet3 as "sidebar_lensNoEntriesYet" }
/**
* | output |
* | --- |
* | "You're all caught up." |
*
* @param {Sidebar_Lensallcaughtup3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensallcaughtup3 = /** @type {((inputs?: Sidebar_Lensallcaughtup3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensallcaughtup3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensallcaughtup3(inputs)
	if (locale === "es") return __es.sidebar_lensallcaughtup3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensallcaughtup3(inputs)
	if (locale === "fr") return __fr.sidebar_lensallcaughtup3(inputs)
	if (locale === "de") return __de.sidebar_lensallcaughtup3(inputs)
	if (locale === "ja") return __ja.sidebar_lensallcaughtup3(inputs)
	if (locale === "ko") return __ko.sidebar_lensallcaughtup3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensallcaughtup3(inputs)
	return __ru.sidebar_lensallcaughtup3(inputs)
});
export { sidebar_lensallcaughtup3 as "sidebar_lensAllCaughtUp" }
/**
* | output |
* | --- |
* | "Nothing here right now." |
*
* @param {Sidebar_Lensnothinghere2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensnothinghere2 = /** @type {((inputs?: Sidebar_Lensnothinghere2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensnothinghere2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensnothinghere2(inputs)
	if (locale === "es") return __es.sidebar_lensnothinghere2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensnothinghere2(inputs)
	if (locale === "fr") return __fr.sidebar_lensnothinghere2(inputs)
	if (locale === "de") return __de.sidebar_lensnothinghere2(inputs)
	if (locale === "ja") return __ja.sidebar_lensnothinghere2(inputs)
	if (locale === "ko") return __ko.sidebar_lensnothinghere2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensnothinghere2(inputs)
	return __ru.sidebar_lensnothinghere2(inputs)
});
export { sidebar_lensnothinghere2 as "sidebar_lensNothingHere" }
/**
* | output |
* | --- |
* | "Refresh now" |
*
* @param {Sidebar_Lensrefresh1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrefresh1 = /** @type {((inputs?: Sidebar_Lensrefresh1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrefresh1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensrefresh1(inputs)
	if (locale === "es") return __es.sidebar_lensrefresh1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensrefresh1(inputs)
	if (locale === "fr") return __fr.sidebar_lensrefresh1(inputs)
	if (locale === "de") return __de.sidebar_lensrefresh1(inputs)
	if (locale === "ja") return __ja.sidebar_lensrefresh1(inputs)
	if (locale === "ko") return __ko.sidebar_lensrefresh1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensrefresh1(inputs)
	return __ru.sidebar_lensrefresh1(inputs)
});
export { sidebar_lensrefresh1 as "sidebar_lensRefresh" }
/**
* | output |
* | --- |
* | "Edit…" |
*
* @param {Sidebar_Lensedit1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensedit1 = /** @type {((inputs?: Sidebar_Lensedit1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensedit1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensedit1(inputs)
	if (locale === "es") return __es.sidebar_lensedit1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensedit1(inputs)
	if (locale === "fr") return __fr.sidebar_lensedit1(inputs)
	if (locale === "de") return __de.sidebar_lensedit1(inputs)
	if (locale === "ja") return __ja.sidebar_lensedit1(inputs)
	if (locale === "ko") return __ko.sidebar_lensedit1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensedit1(inputs)
	return __ru.sidebar_lensedit1(inputs)
});
export { sidebar_lensedit1 as "sidebar_lensEdit" }
/**
* | output |
* | --- |
* | "Open as page" |
*
* @param {Sidebar_Lensopenaspage3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenaspage3 = /** @type {((inputs?: Sidebar_Lensopenaspage3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenaspage3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensopenaspage3(inputs)
	if (locale === "es") return __es.sidebar_lensopenaspage3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensopenaspage3(inputs)
	if (locale === "fr") return __fr.sidebar_lensopenaspage3(inputs)
	if (locale === "de") return __de.sidebar_lensopenaspage3(inputs)
	if (locale === "ja") return __ja.sidebar_lensopenaspage3(inputs)
	if (locale === "ko") return __ko.sidebar_lensopenaspage3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensopenaspage3(inputs)
	return __ru.sidebar_lensopenaspage3(inputs)
});
export { sidebar_lensopenaspage3 as "sidebar_lensOpenAsPage" }
/**
* | output |
* | --- |
* | "Open all in a tab" |
*
* @param {Sidebar_Lensopenall2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenall2 = /** @type {((inputs?: Sidebar_Lensopenall2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenall2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensopenall2(inputs)
	if (locale === "es") return __es.sidebar_lensopenall2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensopenall2(inputs)
	if (locale === "fr") return __fr.sidebar_lensopenall2(inputs)
	if (locale === "de") return __de.sidebar_lensopenall2(inputs)
	if (locale === "ja") return __ja.sidebar_lensopenall2(inputs)
	if (locale === "ko") return __ko.sidebar_lensopenall2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensopenall2(inputs)
	return __ru.sidebar_lensopenall2(inputs)
});
export { sidebar_lensopenall2 as "sidebar_lensOpenAll" }
/**
* | output |
* | --- |
* | "Mark all read" |
*
* @param {Sidebar_Lensmarkallread3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensmarkallread3 = /** @type {((inputs?: Sidebar_Lensmarkallread3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensmarkallread3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensmarkallread3(inputs)
	if (locale === "es") return __es.sidebar_lensmarkallread3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensmarkallread3(inputs)
	if (locale === "fr") return __fr.sidebar_lensmarkallread3(inputs)
	if (locale === "de") return __de.sidebar_lensmarkallread3(inputs)
	if (locale === "ja") return __ja.sidebar_lensmarkallread3(inputs)
	if (locale === "ko") return __ko.sidebar_lensmarkallread3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensmarkallread3(inputs)
	return __ru.sidebar_lensmarkallread3(inputs)
});
export { sidebar_lensmarkallread3 as "sidebar_lensMarkAllRead" }
/**
* | output |
* | --- |
* | "Move up" |
*
* @param {Sidebar_Lensmoveup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensmoveup2 = /** @type {((inputs?: Sidebar_Lensmoveup2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensmoveup2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensmoveup2(inputs)
	if (locale === "es") return __es.sidebar_lensmoveup2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensmoveup2(inputs)
	if (locale === "fr") return __fr.sidebar_lensmoveup2(inputs)
	if (locale === "de") return __de.sidebar_lensmoveup2(inputs)
	if (locale === "ja") return __ja.sidebar_lensmoveup2(inputs)
	if (locale === "ko") return __ko.sidebar_lensmoveup2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensmoveup2(inputs)
	return __ru.sidebar_lensmoveup2(inputs)
});
export { sidebar_lensmoveup2 as "sidebar_lensMoveUp" }
/**
* | output |
* | --- |
* | "Move down" |
*
* @param {Sidebar_Lensmovedown2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensmovedown2 = /** @type {((inputs?: Sidebar_Lensmovedown2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensmovedown2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensmovedown2(inputs)
	if (locale === "es") return __es.sidebar_lensmovedown2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensmovedown2(inputs)
	if (locale === "fr") return __fr.sidebar_lensmovedown2(inputs)
	if (locale === "de") return __de.sidebar_lensmovedown2(inputs)
	if (locale === "ja") return __ja.sidebar_lensmovedown2(inputs)
	if (locale === "ko") return __ko.sidebar_lensmovedown2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensmovedown2(inputs)
	return __ru.sidebar_lensmovedown2(inputs)
});
export { sidebar_lensmovedown2 as "sidebar_lensMoveDown" }
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Sidebar_Lensdelete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensdelete1 = /** @type {((inputs?: Sidebar_Lensdelete1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensdelete1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensdelete1(inputs)
	if (locale === "es") return __es.sidebar_lensdelete1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensdelete1(inputs)
	if (locale === "fr") return __fr.sidebar_lensdelete1(inputs)
	if (locale === "de") return __de.sidebar_lensdelete1(inputs)
	if (locale === "ja") return __ja.sidebar_lensdelete1(inputs)
	if (locale === "ko") return __ko.sidebar_lensdelete1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensdelete1(inputs)
	return __ru.sidebar_lensdelete1(inputs)
});
export { sidebar_lensdelete1 as "sidebar_lensDelete" }
/**
* | output |
* | --- |
* | "Delete — confirm" |
*
* @param {Sidebar_Lensdeleteconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensdeleteconfirm2 = /** @type {((inputs?: Sidebar_Lensdeleteconfirm2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensdeleteconfirm2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensdeleteconfirm2(inputs)
	if (locale === "es") return __es.sidebar_lensdeleteconfirm2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensdeleteconfirm2(inputs)
	if (locale === "fr") return __fr.sidebar_lensdeleteconfirm2(inputs)
	if (locale === "de") return __de.sidebar_lensdeleteconfirm2(inputs)
	if (locale === "ja") return __ja.sidebar_lensdeleteconfirm2(inputs)
	if (locale === "ko") return __ko.sidebar_lensdeleteconfirm2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensdeleteconfirm2(inputs)
	return __ru.sidebar_lensdeleteconfirm2(inputs)
});
export { sidebar_lensdeleteconfirm2 as "sidebar_lensDeleteConfirm" }
/**
* | output |
* | --- |
* | "Open {name}" |
*
* @param {Sidebar_Lensopenpagelabel3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenpagelabel3 = /** @type {((inputs: Sidebar_Lensopenpagelabel3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenpagelabel3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensopenpagelabel3(inputs)
	if (locale === "es") return __es.sidebar_lensopenpagelabel3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensopenpagelabel3(inputs)
	if (locale === "fr") return __fr.sidebar_lensopenpagelabel3(inputs)
	if (locale === "de") return __de.sidebar_lensopenpagelabel3(inputs)
	if (locale === "ja") return __ja.sidebar_lensopenpagelabel3(inputs)
	if (locale === "ko") return __ko.sidebar_lensopenpagelabel3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensopenpagelabel3(inputs)
	return __ru.sidebar_lensopenpagelabel3(inputs)
});
export { sidebar_lensopenpagelabel3 as "sidebar_lensOpenPageLabel" }
/**
* | output |
* | --- |
* | "Open {name}, {badge} {kind}" |
*
* @param {Sidebar_Lensopenpagelabelbadge4Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenpagelabelbadge4 = /** @type {((inputs: Sidebar_Lensopenpagelabelbadge4Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenpagelabelbadge4Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "es") return __es.sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "fr") return __fr.sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "de") return __de.sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "ja") return __ja.sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "ko") return __ko.sidebar_lensopenpagelabelbadge4(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensopenpagelabelbadge4(inputs)
	return __ru.sidebar_lensopenpagelabelbadge4(inputs)
});
export { sidebar_lensopenpagelabelbadge4 as "sidebar_lensOpenPageLabelBadge" }
/**
* | output |
* | --- |
* | "Sign in to {host}" |
*
* @param {Sidebar_Lenssigninto3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenssigninto3 = /** @type {((inputs: Sidebar_Lenssigninto3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenssigninto3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenssigninto3(inputs)
	if (locale === "es") return __es.sidebar_lenssigninto3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenssigninto3(inputs)
	if (locale === "fr") return __fr.sidebar_lenssigninto3(inputs)
	if (locale === "de") return __de.sidebar_lenssigninto3(inputs)
	if (locale === "ja") return __ja.sidebar_lenssigninto3(inputs)
	if (locale === "ko") return __ko.sidebar_lenssigninto3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenssigninto3(inputs)
	return __ru.sidebar_lenssigninto3(inputs)
});
export { sidebar_lenssigninto3 as "sidebar_lensSignInTo" }
/**
* | output |
* | --- |
* | "Add a token" |
*
* @param {Sidebar_Lensaddtoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensaddtoken2 = /** @type {((inputs?: Sidebar_Lensaddtoken2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensaddtoken2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensaddtoken2(inputs)
	if (locale === "es") return __es.sidebar_lensaddtoken2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensaddtoken2(inputs)
	if (locale === "fr") return __fr.sidebar_lensaddtoken2(inputs)
	if (locale === "de") return __de.sidebar_lensaddtoken2(inputs)
	if (locale === "ja") return __ja.sidebar_lensaddtoken2(inputs)
	if (locale === "ko") return __ko.sidebar_lensaddtoken2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensaddtoken2(inputs)
	return __ru.sidebar_lensaddtoken2(inputs)
});
export { sidebar_lensaddtoken2 as "sidebar_lensAddToken" }
/**
* | output |
* | --- |
* | "Reconnect {host}" |
*
* @param {Sidebar_Lensreconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensreconnect1 = /** @type {((inputs: Sidebar_Lensreconnect1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensreconnect1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensreconnect1(inputs)
	if (locale === "es") return __es.sidebar_lensreconnect1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensreconnect1(inputs)
	if (locale === "fr") return __fr.sidebar_lensreconnect1(inputs)
	if (locale === "de") return __de.sidebar_lensreconnect1(inputs)
	if (locale === "ja") return __ja.sidebar_lensreconnect1(inputs)
	if (locale === "ko") return __ko.sidebar_lensreconnect1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensreconnect1(inputs)
	return __ru.sidebar_lensreconnect1(inputs)
});
export { sidebar_lensreconnect1 as "sidebar_lensReconnect" }
/**
* | output |
* | --- |
* | "That token didn't work — check it can read pull requests." |
*
* @param {Sidebar_Lenstokenerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenstokenerror2 = /** @type {((inputs?: Sidebar_Lenstokenerror2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenstokenerror2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenstokenerror2(inputs)
	if (locale === "es") return __es.sidebar_lenstokenerror2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenstokenerror2(inputs)
	if (locale === "fr") return __fr.sidebar_lenstokenerror2(inputs)
	if (locale === "de") return __de.sidebar_lenstokenerror2(inputs)
	if (locale === "ja") return __ja.sidebar_lenstokenerror2(inputs)
	if (locale === "ko") return __ko.sidebar_lenstokenerror2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenstokenerror2(inputs)
	return __ru.sidebar_lenstokenerror2(inputs)
});
export { sidebar_lenstokenerror2 as "sidebar_lensTokenError" }
/**
* | output |
* | --- |
* | "Lunma needs access to {host}" |
*
* @param {Sidebar_Lensneedsaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensneedsaccess2 = /** @type {((inputs: Sidebar_Lensneedsaccess2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensneedsaccess2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensneedsaccess2(inputs)
	if (locale === "es") return __es.sidebar_lensneedsaccess2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensneedsaccess2(inputs)
	if (locale === "fr") return __fr.sidebar_lensneedsaccess2(inputs)
	if (locale === "de") return __de.sidebar_lensneedsaccess2(inputs)
	if (locale === "ja") return __ja.sidebar_lensneedsaccess2(inputs)
	if (locale === "ko") return __ko.sidebar_lensneedsaccess2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensneedsaccess2(inputs)
	return __ru.sidebar_lensneedsaccess2(inputs)
});
export { sidebar_lensneedsaccess2 as "sidebar_lensNeedsAccess" }
/**
* | output |
* | --- |
* | "Close tab" |
*
* @param {Sidebar_Lensclose1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensclose1 = /** @type {((inputs?: Sidebar_Lensclose1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensclose1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensclose1(inputs)
	if (locale === "es") return __es.sidebar_lensclose1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensclose1(inputs)
	if (locale === "fr") return __fr.sidebar_lensclose1(inputs)
	if (locale === "de") return __de.sidebar_lensclose1(inputs)
	if (locale === "ja") return __ja.sidebar_lensclose1(inputs)
	if (locale === "ko") return __ko.sidebar_lensclose1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensclose1(inputs)
	return __ru.sidebar_lensclose1(inputs)
});
export { sidebar_lensclose1 as "sidebar_lensClose" }
/**
* | output |
* | --- |
* | "Mark read" |
*
* @param {Sidebar_Lensdismiss1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensdismiss1 = /** @type {((inputs?: Sidebar_Lensdismiss1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensdismiss1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensdismiss1(inputs)
	if (locale === "es") return __es.sidebar_lensdismiss1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensdismiss1(inputs)
	if (locale === "fr") return __fr.sidebar_lensdismiss1(inputs)
	if (locale === "de") return __de.sidebar_lensdismiss1(inputs)
	if (locale === "ja") return __ja.sidebar_lensdismiss1(inputs)
	if (locale === "ko") return __ko.sidebar_lensdismiss1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensdismiss1(inputs)
	return __ru.sidebar_lensdismiss1(inputs)
});
export { sidebar_lensdismiss1 as "sidebar_lensDismiss" }
/**
* | output |
* | --- |
* | "Lens is filtered — open overview to change filter" |
*
* @param {Sidebar_Lensfiltered1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensfiltered1 = /** @type {((inputs?: Sidebar_Lensfiltered1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensfiltered1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensfiltered1(inputs)
	if (locale === "es") return __es.sidebar_lensfiltered1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensfiltered1(inputs)
	if (locale === "fr") return __fr.sidebar_lensfiltered1(inputs)
	if (locale === "de") return __de.sidebar_lensfiltered1(inputs)
	if (locale === "ja") return __ja.sidebar_lensfiltered1(inputs)
	if (locale === "ko") return __ko.sidebar_lensfiltered1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensfiltered1(inputs)
	return __ru.sidebar_lensfiltered1(inputs)
});
export { sidebar_lensfiltered1 as "sidebar_lensFiltered" }
/**
* | output |
* | --- |
* | "Couldn't reach {host}" |
*
* @param {Sidebar_Lenscouldnotreach3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscouldnotreach3 = /** @type {((inputs: Sidebar_Lenscouldnotreach3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscouldnotreach3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenscouldnotreach3(inputs)
	if (locale === "es") return __es.sidebar_lenscouldnotreach3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenscouldnotreach3(inputs)
	if (locale === "fr") return __fr.sidebar_lenscouldnotreach3(inputs)
	if (locale === "de") return __de.sidebar_lenscouldnotreach3(inputs)
	if (locale === "ja") return __ja.sidebar_lenscouldnotreach3(inputs)
	if (locale === "ko") return __ko.sidebar_lenscouldnotreach3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenscouldnotreach3(inputs)
	return __ru.sidebar_lenscouldnotreach3(inputs)
});
export { sidebar_lenscouldnotreach3 as "sidebar_lensCouldNotReach" }
/**
* | output |
* | --- |
* | "Show {count} read" |
*
* @param {Sidebar_Lensshowread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensshowread2 = /** @type {((inputs: Sidebar_Lensshowread2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensshowread2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensshowread2(inputs)
	if (locale === "es") return __es.sidebar_lensshowread2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensshowread2(inputs)
	if (locale === "fr") return __fr.sidebar_lensshowread2(inputs)
	if (locale === "de") return __de.sidebar_lensshowread2(inputs)
	if (locale === "ja") return __ja.sidebar_lensshowread2(inputs)
	if (locale === "ko") return __ko.sidebar_lensshowread2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensshowread2(inputs)
	return __ru.sidebar_lensshowread2(inputs)
});
export { sidebar_lensshowread2 as "sidebar_lensShowRead" }
/**
* | output |
* | --- |
* | "Hide {count} read" |
*
* @param {Sidebar_Lenshideread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenshideread2 = /** @type {((inputs: Sidebar_Lenshideread2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenshideread2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenshideread2(inputs)
	if (locale === "es") return __es.sidebar_lenshideread2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenshideread2(inputs)
	if (locale === "fr") return __fr.sidebar_lenshideread2(inputs)
	if (locale === "de") return __de.sidebar_lenshideread2(inputs)
	if (locale === "ja") return __ja.sidebar_lenshideread2(inputs)
	if (locale === "ko") return __ko.sidebar_lenshideread2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenshideread2(inputs)
	return __ru.sidebar_lenshideread2(inputs)
});
export { sidebar_lenshideread2 as "sidebar_lensHideRead" }
/**
* | output |
* | --- |
* | "Open all" |
*
* @param {Sidebar_Lensopenallfeed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenallfeed3 = /** @type {((inputs?: Sidebar_Lensopenallfeed3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenallfeed3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensopenallfeed3(inputs)
	if (locale === "es") return __es.sidebar_lensopenallfeed3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensopenallfeed3(inputs)
	if (locale === "fr") return __fr.sidebar_lensopenallfeed3(inputs)
	if (locale === "de") return __de.sidebar_lensopenallfeed3(inputs)
	if (locale === "ja") return __ja.sidebar_lensopenallfeed3(inputs)
	if (locale === "ko") return __ko.sidebar_lensopenallfeed3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensopenallfeed3(inputs)
	return __ru.sidebar_lensopenallfeed3(inputs)
});
export { sidebar_lensopenallfeed3 as "sidebar_lensOpenAllFeed" }
/**
* | output |
* | --- |
* | "Account removed — reconnect or pick another" |
*
* @param {Sidebar_Lensaccountremoved2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensaccountremoved2 = /** @type {((inputs?: Sidebar_Lensaccountremoved2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensaccountremoved2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensaccountremoved2(inputs)
	if (locale === "es") return __es.sidebar_lensaccountremoved2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensaccountremoved2(inputs)
	if (locale === "fr") return __fr.sidebar_lensaccountremoved2(inputs)
	if (locale === "de") return __de.sidebar_lensaccountremoved2(inputs)
	if (locale === "ja") return __ja.sidebar_lensaccountremoved2(inputs)
	if (locale === "ko") return __ko.sidebar_lensaccountremoved2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensaccountremoved2(inputs)
	return __ru.sidebar_lensaccountremoved2(inputs)
});
export { sidebar_lensaccountremoved2 as "sidebar_lensAccountRemoved" }
/**
* | output |
* | --- |
* | "Edit lens" |
*
* @param {Sidebar_Editlenssheet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_editlenssheet2 = /** @type {((inputs?: Sidebar_Editlenssheet2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Editlenssheet2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_editlenssheet2(inputs)
	if (locale === "es") return __es.sidebar_editlenssheet2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_editlenssheet2(inputs)
	if (locale === "fr") return __fr.sidebar_editlenssheet2(inputs)
	if (locale === "de") return __de.sidebar_editlenssheet2(inputs)
	if (locale === "ja") return __ja.sidebar_editlenssheet2(inputs)
	if (locale === "ko") return __ko.sidebar_editlenssheet2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_editlenssheet2(inputs)
	return __ru.sidebar_editlenssheet2(inputs)
});
export { sidebar_editlenssheet2 as "sidebar_editLensSheet" }
/**
* | output |
* | --- |
* | "Go home" |
*
* @param {Sidebar_Gohome1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_gohome1 = /** @type {((inputs?: Sidebar_Gohome1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Gohome1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_gohome1(inputs)
	if (locale === "es") return __es.sidebar_gohome1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_gohome1(inputs)
	if (locale === "fr") return __fr.sidebar_gohome1(inputs)
	if (locale === "de") return __de.sidebar_gohome1(inputs)
	if (locale === "ja") return __ja.sidebar_gohome1(inputs)
	if (locale === "ko") return __ko.sidebar_gohome1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_gohome1(inputs)
	return __ru.sidebar_gohome1(inputs)
});
export { sidebar_gohome1 as "sidebar_goHome" }
/**
* | output |
* | --- |
* | "Make this home" |
*
* @param {Sidebar_Makethishome2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_makethishome2 = /** @type {((inputs?: Sidebar_Makethishome2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Makethishome2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_makethishome2(inputs)
	if (locale === "es") return __es.sidebar_makethishome2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_makethishome2(inputs)
	if (locale === "fr") return __fr.sidebar_makethishome2(inputs)
	if (locale === "de") return __de.sidebar_makethishome2(inputs)
	if (locale === "ja") return __ja.sidebar_makethishome2(inputs)
	if (locale === "ko") return __ko.sidebar_makethishome2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_makethishome2(inputs)
	return __ru.sidebar_makethishome2(inputs)
});
export { sidebar_makethishome2 as "sidebar_makeThisHome" }
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Sidebar_Tabrename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabrename1 = /** @type {((inputs?: Sidebar_Tabrename1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabrename1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabrename1(inputs)
	if (locale === "es") return __es.sidebar_tabrename1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabrename1(inputs)
	if (locale === "fr") return __fr.sidebar_tabrename1(inputs)
	if (locale === "de") return __de.sidebar_tabrename1(inputs)
	if (locale === "ja") return __ja.sidebar_tabrename1(inputs)
	if (locale === "ko") return __ko.sidebar_tabrename1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabrename1(inputs)
	return __ru.sidebar_tabrename1(inputs)
});
export { sidebar_tabrename1 as "sidebar_tabRename" }
/**
* | output |
* | --- |
* | "Reset name" |
*
* @param {Sidebar_Tabresetname2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabresetname2 = /** @type {((inputs?: Sidebar_Tabresetname2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabresetname2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabresetname2(inputs)
	if (locale === "es") return __es.sidebar_tabresetname2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabresetname2(inputs)
	if (locale === "fr") return __fr.sidebar_tabresetname2(inputs)
	if (locale === "de") return __de.sidebar_tabresetname2(inputs)
	if (locale === "ja") return __ja.sidebar_tabresetname2(inputs)
	if (locale === "ko") return __ko.sidebar_tabresetname2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabresetname2(inputs)
	return __ru.sidebar_tabresetname2(inputs)
});
export { sidebar_tabresetname2 as "sidebar_tabResetName" }
/**
* | output |
* | --- |
* | "Lock to its site…" |
*
* @param {Sidebar_Tablocktosite3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tablocktosite3 = /** @type {((inputs?: Sidebar_Tablocktosite3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tablocktosite3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tablocktosite3(inputs)
	if (locale === "es") return __es.sidebar_tablocktosite3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tablocktosite3(inputs)
	if (locale === "fr") return __fr.sidebar_tablocktosite3(inputs)
	if (locale === "de") return __de.sidebar_tablocktosite3(inputs)
	if (locale === "ja") return __ja.sidebar_tablocktosite3(inputs)
	if (locale === "ko") return __ko.sidebar_tablocktosite3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tablocktosite3(inputs)
	return __ru.sidebar_tablocktosite3(inputs)
});
export { sidebar_tablocktosite3 as "sidebar_tabLockToSite" }
/**
* | output |
* | --- |
* | "Move up" |
*
* @param {Sidebar_Tabmoveup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabmoveup2 = /** @type {((inputs?: Sidebar_Tabmoveup2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabmoveup2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabmoveup2(inputs)
	if (locale === "es") return __es.sidebar_tabmoveup2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabmoveup2(inputs)
	if (locale === "fr") return __fr.sidebar_tabmoveup2(inputs)
	if (locale === "de") return __de.sidebar_tabmoveup2(inputs)
	if (locale === "ja") return __ja.sidebar_tabmoveup2(inputs)
	if (locale === "ko") return __ko.sidebar_tabmoveup2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabmoveup2(inputs)
	return __ru.sidebar_tabmoveup2(inputs)
});
export { sidebar_tabmoveup2 as "sidebar_tabMoveUp" }
/**
* | output |
* | --- |
* | "Move down" |
*
* @param {Sidebar_Tabmovedown2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabmovedown2 = /** @type {((inputs?: Sidebar_Tabmovedown2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabmovedown2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabmovedown2(inputs)
	if (locale === "es") return __es.sidebar_tabmovedown2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabmovedown2(inputs)
	if (locale === "fr") return __fr.sidebar_tabmovedown2(inputs)
	if (locale === "de") return __de.sidebar_tabmovedown2(inputs)
	if (locale === "ja") return __ja.sidebar_tabmovedown2(inputs)
	if (locale === "ko") return __ko.sidebar_tabmovedown2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabmovedown2(inputs)
	return __ru.sidebar_tabmovedown2(inputs)
});
export { sidebar_tabmovedown2 as "sidebar_tabMoveDown" }
/**
* | output |
* | --- |
* | "Unpin" |
*
* @param {Sidebar_Tabunpin1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabunpin1 = /** @type {((inputs?: Sidebar_Tabunpin1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabunpin1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabunpin1(inputs)
	if (locale === "es") return __es.sidebar_tabunpin1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabunpin1(inputs)
	if (locale === "fr") return __fr.sidebar_tabunpin1(inputs)
	if (locale === "de") return __de.sidebar_tabunpin1(inputs)
	if (locale === "ja") return __ja.sidebar_tabunpin1(inputs)
	if (locale === "ko") return __ko.sidebar_tabunpin1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabunpin1(inputs)
	return __ru.sidebar_tabunpin1(inputs)
});
export { sidebar_tabunpin1 as "sidebar_tabUnpin" }
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Sidebar_Tabdelete1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabdelete1 = /** @type {((inputs?: Sidebar_Tabdelete1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabdelete1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabdelete1(inputs)
	if (locale === "es") return __es.sidebar_tabdelete1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabdelete1(inputs)
	if (locale === "fr") return __fr.sidebar_tabdelete1(inputs)
	if (locale === "de") return __de.sidebar_tabdelete1(inputs)
	if (locale === "ja") return __ja.sidebar_tabdelete1(inputs)
	if (locale === "ko") return __ko.sidebar_tabdelete1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabdelete1(inputs)
	return __ru.sidebar_tabdelete1(inputs)
});
export { sidebar_tabdelete1 as "sidebar_tabDelete" }
/**
* | output |
* | --- |
* | "Delete — confirm" |
*
* @param {Sidebar_Tabdeleteconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabdeleteconfirm2 = /** @type {((inputs?: Sidebar_Tabdeleteconfirm2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabdeleteconfirm2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabdeleteconfirm2(inputs)
	if (locale === "es") return __es.sidebar_tabdeleteconfirm2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabdeleteconfirm2(inputs)
	if (locale === "fr") return __fr.sidebar_tabdeleteconfirm2(inputs)
	if (locale === "de") return __de.sidebar_tabdeleteconfirm2(inputs)
	if (locale === "ja") return __ja.sidebar_tabdeleteconfirm2(inputs)
	if (locale === "ko") return __ko.sidebar_tabdeleteconfirm2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabdeleteconfirm2(inputs)
	return __ru.sidebar_tabdeleteconfirm2(inputs)
});
export { sidebar_tabdeleteconfirm2 as "sidebar_tabDeleteConfirm" }
/**
* | output |
* | --- |
* | "Close tab" |
*
* @param {Sidebar_Closetablabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_closetablabel2 = /** @type {((inputs?: Sidebar_Closetablabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Closetablabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_closetablabel2(inputs)
	if (locale === "es") return __es.sidebar_closetablabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_closetablabel2(inputs)
	if (locale === "fr") return __fr.sidebar_closetablabel2(inputs)
	if (locale === "de") return __de.sidebar_closetablabel2(inputs)
	if (locale === "ja") return __ja.sidebar_closetablabel2(inputs)
	if (locale === "ko") return __ko.sidebar_closetablabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_closetablabel2(inputs)
	return __ru.sidebar_closetablabel2(inputs)
});
export { sidebar_closetablabel2 as "sidebar_closeTabLabel" }
/**
* | output |
* | --- |
* | "No pinned tabs yet." |
*
* @param {Sidebar_Nopinnedtabs2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_nopinnedtabs2 = /** @type {((inputs?: Sidebar_Nopinnedtabs2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Nopinnedtabs2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_nopinnedtabs2(inputs)
	if (locale === "es") return __es.sidebar_nopinnedtabs2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_nopinnedtabs2(inputs)
	if (locale === "fr") return __fr.sidebar_nopinnedtabs2(inputs)
	if (locale === "de") return __de.sidebar_nopinnedtabs2(inputs)
	if (locale === "ja") return __ja.sidebar_nopinnedtabs2(inputs)
	if (locale === "ko") return __ko.sidebar_nopinnedtabs2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_nopinnedtabs2(inputs)
	return __ru.sidebar_nopinnedtabs2(inputs)
});
export { sidebar_nopinnedtabs2 as "sidebar_noPinnedTabs" }
/**
* | output |
* | --- |
* | "Drag a tab up here, or press {modifier}, to pin it." |
*
* @param {Sidebar_Dragtabstopinhint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_dragtabstopinhint4 = /** @type {((inputs: Sidebar_Dragtabstopinhint4Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Dragtabstopinhint4Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_dragtabstopinhint4(inputs)
	if (locale === "es") return __es.sidebar_dragtabstopinhint4(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_dragtabstopinhint4(inputs)
	if (locale === "fr") return __fr.sidebar_dragtabstopinhint4(inputs)
	if (locale === "de") return __de.sidebar_dragtabstopinhint4(inputs)
	if (locale === "ja") return __ja.sidebar_dragtabstopinhint4(inputs)
	if (locale === "ko") return __ko.sidebar_dragtabstopinhint4(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_dragtabstopinhint4(inputs)
	return __ru.sidebar_dragtabstopinhint4(inputs)
});
export { sidebar_dragtabstopinhint4 as "sidebar_dragTabsToPinHint" }
/**
* | output |
* | --- |
* | "Empty — drag tabs here." |
*
* @param {Sidebar_Emptyfolderhint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_emptyfolderhint2 = /** @type {((inputs?: Sidebar_Emptyfolderhint2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Emptyfolderhint2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_emptyfolderhint2(inputs)
	if (locale === "es") return __es.sidebar_emptyfolderhint2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_emptyfolderhint2(inputs)
	if (locale === "fr") return __fr.sidebar_emptyfolderhint2(inputs)
	if (locale === "de") return __de.sidebar_emptyfolderhint2(inputs)
	if (locale === "ja") return __ja.sidebar_emptyfolderhint2(inputs)
	if (locale === "ko") return __ko.sidebar_emptyfolderhint2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_emptyfolderhint2(inputs)
	return __ru.sidebar_emptyfolderhint2(inputs)
});
export { sidebar_emptyfolderhint2 as "sidebar_emptyFolderHint" }
/**
* | output |
* | --- |
* | "Lock to its site" |
*
* @param {Sidebar_Locktositetitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_locktositetitle3 = /** @type {((inputs?: Sidebar_Locktositetitle3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Locktositetitle3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_locktositetitle3(inputs)
	if (locale === "es") return __es.sidebar_locktositetitle3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_locktositetitle3(inputs)
	if (locale === "fr") return __fr.sidebar_locktositetitle3(inputs)
	if (locale === "de") return __de.sidebar_locktositetitle3(inputs)
	if (locale === "ja") return __ja.sidebar_locktositetitle3(inputs)
	if (locale === "ko") return __ko.sidebar_locktositetitle3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_locktositetitle3(inputs)
	return __ru.sidebar_locktositetitle3(inputs)
});
export { sidebar_locktositetitle3 as "sidebar_lockToSiteTitle" }
/**
* | output |
* | --- |
* | "New Space" |
*
* @param {Sidebar_Spaceeditortitlenew3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditortitlenew3 = /** @type {((inputs?: Sidebar_Spaceeditortitlenew3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditortitlenew3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceeditortitlenew3(inputs)
	if (locale === "es") return __es.sidebar_spaceeditortitlenew3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceeditortitlenew3(inputs)
	if (locale === "fr") return __fr.sidebar_spaceeditortitlenew3(inputs)
	if (locale === "de") return __de.sidebar_spaceeditortitlenew3(inputs)
	if (locale === "ja") return __ja.sidebar_spaceeditortitlenew3(inputs)
	if (locale === "ko") return __ko.sidebar_spaceeditortitlenew3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceeditortitlenew3(inputs)
	return __ru.sidebar_spaceeditortitlenew3(inputs)
});
export { sidebar_spaceeditortitlenew3 as "sidebar_spaceEditorTitleNew" }
/**
* | output |
* | --- |
* | "Edit Space" |
*
* @param {Sidebar_Spaceeditortitleedit3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditortitleedit3 = /** @type {((inputs?: Sidebar_Spaceeditortitleedit3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditortitleedit3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceeditortitleedit3(inputs)
	if (locale === "es") return __es.sidebar_spaceeditortitleedit3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceeditortitleedit3(inputs)
	if (locale === "fr") return __fr.sidebar_spaceeditortitleedit3(inputs)
	if (locale === "de") return __de.sidebar_spaceeditortitleedit3(inputs)
	if (locale === "ja") return __ja.sidebar_spaceeditortitleedit3(inputs)
	if (locale === "ko") return __ko.sidebar_spaceeditortitleedit3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceeditortitleedit3(inputs)
	return __ru.sidebar_spaceeditortitleedit3(inputs)
});
export { sidebar_spaceeditortitleedit3 as "sidebar_spaceEditorTitleEdit" }
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Sidebar_Spacename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacename1 = /** @type {((inputs?: Sidebar_Spacename1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacename1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spacename1(inputs)
	if (locale === "es") return __es.sidebar_spacename1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spacename1(inputs)
	if (locale === "fr") return __fr.sidebar_spacename1(inputs)
	if (locale === "de") return __de.sidebar_spacename1(inputs)
	if (locale === "ja") return __ja.sidebar_spacename1(inputs)
	if (locale === "ko") return __ko.sidebar_spacename1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spacename1(inputs)
	return __ru.sidebar_spacename1(inputs)
});
export { sidebar_spacename1 as "sidebar_spaceName" }
/**
* | output |
* | --- |
* | "e.g. Work, Reading, Personal" |
*
* @param {Sidebar_Spacenameplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacenameplaceholder2 = /** @type {((inputs?: Sidebar_Spacenameplaceholder2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacenameplaceholder2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spacenameplaceholder2(inputs)
	if (locale === "es") return __es.sidebar_spacenameplaceholder2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spacenameplaceholder2(inputs)
	if (locale === "fr") return __fr.sidebar_spacenameplaceholder2(inputs)
	if (locale === "de") return __de.sidebar_spacenameplaceholder2(inputs)
	if (locale === "ja") return __ja.sidebar_spacenameplaceholder2(inputs)
	if (locale === "ko") return __ko.sidebar_spacenameplaceholder2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spacenameplaceholder2(inputs)
	return __ru.sidebar_spacenameplaceholder2(inputs)
});
export { sidebar_spacenameplaceholder2 as "sidebar_spaceNamePlaceholder" }
/**
* | output |
* | --- |
* | "A space named \"{name}\" already exists." |
*
* @param {Sidebar_Spaceduplicate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceduplicate1 = /** @type {((inputs: Sidebar_Spaceduplicate1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceduplicate1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceduplicate1(inputs)
	if (locale === "es") return __es.sidebar_spaceduplicate1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceduplicate1(inputs)
	if (locale === "fr") return __fr.sidebar_spaceduplicate1(inputs)
	if (locale === "de") return __de.sidebar_spaceduplicate1(inputs)
	if (locale === "ja") return __ja.sidebar_spaceduplicate1(inputs)
	if (locale === "ko") return __ko.sidebar_spaceduplicate1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceduplicate1(inputs)
	return __ru.sidebar_spaceduplicate1(inputs)
});
export { sidebar_spaceduplicate1 as "sidebar_spaceDuplicate" }
/**
* | output |
* | --- |
* | "Color" |
*
* @param {Sidebar_Spacecolor1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacecolor1 = /** @type {((inputs?: Sidebar_Spacecolor1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacecolor1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spacecolor1(inputs)
	if (locale === "es") return __es.sidebar_spacecolor1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spacecolor1(inputs)
	if (locale === "fr") return __fr.sidebar_spacecolor1(inputs)
	if (locale === "de") return __de.sidebar_spacecolor1(inputs)
	if (locale === "ja") return __ja.sidebar_spacecolor1(inputs)
	if (locale === "ko") return __ko.sidebar_spacecolor1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spacecolor1(inputs)
	return __ru.sidebar_spacecolor1(inputs)
});
export { sidebar_spacecolor1 as "sidebar_spaceColor" }
/**
* | output |
* | --- |
* | "Icon" |
*
* @param {Sidebar_Spaceicon1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceicon1 = /** @type {((inputs?: Sidebar_Spaceicon1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceicon1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceicon1(inputs)
	if (locale === "es") return __es.sidebar_spaceicon1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceicon1(inputs)
	if (locale === "fr") return __fr.sidebar_spaceicon1(inputs)
	if (locale === "de") return __de.sidebar_spaceicon1(inputs)
	if (locale === "ja") return __ja.sidebar_spaceicon1(inputs)
	if (locale === "ko") return __ko.sidebar_spaceicon1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceicon1(inputs)
	return __ru.sidebar_spaceicon1(inputs)
});
export { sidebar_spaceicon1 as "sidebar_spaceIcon" }
/**
* | output |
* | --- |
* | "Auto-archive" |
*
* @param {Sidebar_Spaceautoarchive2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceautoarchive2 = /** @type {((inputs?: Sidebar_Spaceautoarchive2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceautoarchive2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceautoarchive2(inputs)
	if (locale === "es") return __es.sidebar_spaceautoarchive2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceautoarchive2(inputs)
	if (locale === "fr") return __fr.sidebar_spaceautoarchive2(inputs)
	if (locale === "de") return __de.sidebar_spaceautoarchive2(inputs)
	if (locale === "ja") return __ja.sidebar_spaceautoarchive2(inputs)
	if (locale === "ko") return __ko.sidebar_spaceautoarchive2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceautoarchive2(inputs)
	return __ru.sidebar_spaceautoarchive2(inputs)
});
export { sidebar_spaceautoarchive2 as "sidebar_spaceAutoArchive" }
/**
* | output |
* | --- |
* | "Inherit the global setting, or set this Space's own idle-tab policy." |
*
* @param {Sidebar_Autoarchivecreatehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivecreatehelp3 = /** @type {((inputs?: Sidebar_Autoarchivecreatehelp3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivecreatehelp3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "es") return __es.sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "de") return __de.sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchivecreatehelp3(inputs)
	return __ru.sidebar_autoarchivecreatehelp3(inputs)
});
export { sidebar_autoarchivecreatehelp3 as "sidebar_autoArchiveCreateHelp" }
/**
* | output |
* | --- |
* | "Override when this Space's idle tabs are archived." |
*
* @param {Sidebar_Autoarchiveedithelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchiveedithelp3 = /** @type {((inputs?: Sidebar_Autoarchiveedithelp3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchiveedithelp3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchiveedithelp3(inputs)
	if (locale === "es") return __es.sidebar_autoarchiveedithelp3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchiveedithelp3(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchiveedithelp3(inputs)
	if (locale === "de") return __de.sidebar_autoarchiveedithelp3(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchiveedithelp3(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchiveedithelp3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchiveedithelp3(inputs)
	return __ru.sidebar_autoarchiveedithelp3(inputs)
});
export { sidebar_autoarchiveedithelp3 as "sidebar_autoArchiveEditHelp" }
/**
* | output |
* | --- |
* | "Inherit" |
*
* @param {Sidebar_Autoarchivemodeinherit3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemodeinherit3 = /** @type {((inputs?: Sidebar_Autoarchivemodeinherit3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemodeinherit3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "es") return __es.sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "de") return __de.sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchivemodeinherit3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchivemodeinherit3(inputs)
	return __ru.sidebar_autoarchivemodeinherit3(inputs)
});
export { sidebar_autoarchivemodeinherit3 as "sidebar_autoArchiveModeInherit" }
/**
* | output |
* | --- |
* | "Off" |
*
* @param {Sidebar_Autoarchivemodeoff3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemodeoff3 = /** @type {((inputs?: Sidebar_Autoarchivemodeoff3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemodeoff3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchivemodeoff3(inputs)
	if (locale === "es") return __es.sidebar_autoarchivemodeoff3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchivemodeoff3(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchivemodeoff3(inputs)
	if (locale === "de") return __de.sidebar_autoarchivemodeoff3(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchivemodeoff3(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchivemodeoff3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchivemodeoff3(inputs)
	return __ru.sidebar_autoarchivemodeoff3(inputs)
});
export { sidebar_autoarchivemodeoff3 as "sidebar_autoArchiveModeOff" }
/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Sidebar_Autoarchivemodecustom3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemodecustom3 = /** @type {((inputs?: Sidebar_Autoarchivemodecustom3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemodecustom3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchivemodecustom3(inputs)
	if (locale === "es") return __es.sidebar_autoarchivemodecustom3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchivemodecustom3(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchivemodecustom3(inputs)
	if (locale === "de") return __de.sidebar_autoarchivemodecustom3(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchivemodecustom3(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchivemodecustom3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchivemodecustom3(inputs)
	return __ru.sidebar_autoarchivemodecustom3(inputs)
});
export { sidebar_autoarchivemodecustom3 as "sidebar_autoArchiveModeCustom" }
/**
* | output |
* | --- |
* | "Archive after" |
*
* @param {Sidebar_Archiveafterlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_archiveafterlabel2 = /** @type {((inputs?: Sidebar_Archiveafterlabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Archiveafterlabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_archiveafterlabel2(inputs)
	if (locale === "es") return __es.sidebar_archiveafterlabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_archiveafterlabel2(inputs)
	if (locale === "fr") return __fr.sidebar_archiveafterlabel2(inputs)
	if (locale === "de") return __de.sidebar_archiveafterlabel2(inputs)
	if (locale === "ja") return __ja.sidebar_archiveafterlabel2(inputs)
	if (locale === "ko") return __ko.sidebar_archiveafterlabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_archiveafterlabel2(inputs)
	return __ru.sidebar_archiveafterlabel2(inputs)
});
export { sidebar_archiveafterlabel2 as "sidebar_archiveAfterLabel" }
/**
* | output |
* | --- |
* | "minutes idle" |
*
* @param {Sidebar_Minutesidlelabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_minutesidlelabel2 = /** @type {((inputs?: Sidebar_Minutesidlelabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Minutesidlelabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_minutesidlelabel2(inputs)
	if (locale === "es") return __es.sidebar_minutesidlelabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_minutesidlelabel2(inputs)
	if (locale === "fr") return __fr.sidebar_minutesidlelabel2(inputs)
	if (locale === "de") return __de.sidebar_minutesidlelabel2(inputs)
	if (locale === "ja") return __ja.sidebar_minutesidlelabel2(inputs)
	if (locale === "ko") return __ko.sidebar_minutesidlelabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_minutesidlelabel2(inputs)
	return __ru.sidebar_minutesidlelabel2(inputs)
});
export { sidebar_minutesidlelabel2 as "sidebar_minutesIdleLabel" }
/**
* | output |
* | --- |
* | "Are you sure? This will remove the space and unpin all its tabs." |
*
* @param {Sidebar_Deletespaceconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_deletespaceconfirm2 = /** @type {((inputs?: Sidebar_Deletespaceconfirm2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Deletespaceconfirm2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_deletespaceconfirm2(inputs)
	if (locale === "es") return __es.sidebar_deletespaceconfirm2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_deletespaceconfirm2(inputs)
	if (locale === "fr") return __fr.sidebar_deletespaceconfirm2(inputs)
	if (locale === "de") return __de.sidebar_deletespaceconfirm2(inputs)
	if (locale === "ja") return __ja.sidebar_deletespaceconfirm2(inputs)
	if (locale === "ko") return __ko.sidebar_deletespaceconfirm2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_deletespaceconfirm2(inputs)
	return __ru.sidebar_deletespaceconfirm2(inputs)
});
export { sidebar_deletespaceconfirm2 as "sidebar_deleteSpaceConfirm" }
/**
* | output |
* | --- |
* | "Delete Space…" |
*
* @param {Sidebar_Deletespacebutton2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_deletespacebutton2 = /** @type {((inputs?: Sidebar_Deletespacebutton2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Deletespacebutton2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_deletespacebutton2(inputs)
	if (locale === "es") return __es.sidebar_deletespacebutton2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_deletespacebutton2(inputs)
	if (locale === "fr") return __fr.sidebar_deletespacebutton2(inputs)
	if (locale === "de") return __de.sidebar_deletespacebutton2(inputs)
	if (locale === "ja") return __ja.sidebar_deletespacebutton2(inputs)
	if (locale === "ko") return __ko.sidebar_deletespacebutton2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_deletespacebutton2(inputs)
	return __ru.sidebar_deletespacebutton2(inputs)
});
export { sidebar_deletespacebutton2 as "sidebar_deleteSpaceButton" }
/**
* | output |
* | --- |
* | "Create Space" |
*
* @param {Sidebar_Spaceeditorconfirmcreate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditorconfirmcreate3 = /** @type {((inputs?: Sidebar_Spaceeditorconfirmcreate3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditorconfirmcreate3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "es") return __es.sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "fr") return __fr.sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "de") return __de.sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "ja") return __ja.sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "ko") return __ko.sidebar_spaceeditorconfirmcreate3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceeditorconfirmcreate3(inputs)
	return __ru.sidebar_spaceeditorconfirmcreate3(inputs)
});
export { sidebar_spaceeditorconfirmcreate3 as "sidebar_spaceEditorConfirmCreate" }
/**
* | output |
* | --- |
* | "Save changes" |
*
* @param {Sidebar_Spaceeditorconfirmsave3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditorconfirmsave3 = /** @type {((inputs?: Sidebar_Spaceeditorconfirmsave3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditorconfirmsave3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "es") return __es.sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "fr") return __fr.sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "de") return __de.sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "ja") return __ja.sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "ko") return __ko.sidebar_spaceeditorconfirmsave3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceeditorconfirmsave3(inputs)
	return __ru.sidebar_spaceeditorconfirmsave3(inputs)
});
export { sidebar_spaceeditorconfirmsave3 as "sidebar_spaceEditorConfirmSave" }
/**
* | output |
* | --- |
* | "{name} · click to edit" |
*
* @param {Sidebar_Spacetooltipedit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacetooltipedit2 = /** @type {((inputs: Sidebar_Spacetooltipedit2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacetooltipedit2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spacetooltipedit2(inputs)
	if (locale === "es") return __es.sidebar_spacetooltipedit2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spacetooltipedit2(inputs)
	if (locale === "fr") return __fr.sidebar_spacetooltipedit2(inputs)
	if (locale === "de") return __de.sidebar_spacetooltipedit2(inputs)
	if (locale === "ja") return __ja.sidebar_spacetooltipedit2(inputs)
	if (locale === "ko") return __ko.sidebar_spacetooltipedit2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spacetooltipedit2(inputs)
	return __ru.sidebar_spacetooltipedit2(inputs)
});
export { sidebar_spacetooltipedit2 as "sidebar_spaceTooltipEdit" }
/**
* | output |
* | --- |
* | "Activate {name}" |
*
* @param {Sidebar_Spacetooltipactivate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacetooltipactivate2 = /** @type {((inputs: Sidebar_Spacetooltipactivate2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacetooltipactivate2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spacetooltipactivate2(inputs)
	if (locale === "es") return __es.sidebar_spacetooltipactivate2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spacetooltipactivate2(inputs)
	if (locale === "fr") return __fr.sidebar_spacetooltipactivate2(inputs)
	if (locale === "de") return __de.sidebar_spacetooltipactivate2(inputs)
	if (locale === "ja") return __ja.sidebar_spacetooltipactivate2(inputs)
	if (locale === "ko") return __ko.sidebar_spacetooltipactivate2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spacetooltipactivate2(inputs)
	return __ru.sidebar_spacetooltipactivate2(inputs)
});
export { sidebar_spacetooltipactivate2 as "sidebar_spaceTooltipActivate" }
/**
* | output |
* | --- |
* | "New Space" |
*
* @param {Sidebar_Addspace1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_addspace1 = /** @type {((inputs?: Sidebar_Addspace1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Addspace1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_addspace1(inputs)
	if (locale === "es") return __es.sidebar_addspace1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_addspace1(inputs)
	if (locale === "fr") return __fr.sidebar_addspace1(inputs)
	if (locale === "de") return __de.sidebar_addspace1(inputs)
	if (locale === "ja") return __ja.sidebar_addspace1(inputs)
	if (locale === "ko") return __ko.sidebar_addspace1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_addspace1(inputs)
	return __ru.sidebar_addspace1(inputs)
});
export { sidebar_addspace1 as "sidebar_addSpace" }
/**
* | output |
* | --- |
* | "Open Lunma options" |
*
* @param {Sidebar_Openoptions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_openoptions1 = /** @type {((inputs?: Sidebar_Openoptions1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Openoptions1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_openoptions1(inputs)
	if (locale === "es") return __es.sidebar_openoptions1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_openoptions1(inputs)
	if (locale === "fr") return __fr.sidebar_openoptions1(inputs)
	if (locale === "de") return __de.sidebar_openoptions1(inputs)
	if (locale === "ja") return __ja.sidebar_openoptions1(inputs)
	if (locale === "ko") return __ko.sidebar_openoptions1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_openoptions1(inputs)
	return __ru.sidebar_openoptions1(inputs)
});
export { sidebar_openoptions1 as "sidebar_openOptions" }
/**
* | output |
* | --- |
* | "Favorite" |
*
* @param {Sidebar_Tempfavorite1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempfavorite1 = /** @type {((inputs?: Sidebar_Tempfavorite1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempfavorite1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tempfavorite1(inputs)
	if (locale === "es") return __es.sidebar_tempfavorite1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tempfavorite1(inputs)
	if (locale === "fr") return __fr.sidebar_tempfavorite1(inputs)
	if (locale === "de") return __de.sidebar_tempfavorite1(inputs)
	if (locale === "ja") return __ja.sidebar_tempfavorite1(inputs)
	if (locale === "ko") return __ko.sidebar_tempfavorite1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tempfavorite1(inputs)
	return __ru.sidebar_tempfavorite1(inputs)
});
export { sidebar_tempfavorite1 as "sidebar_tempFavorite" }
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Sidebar_Temprename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_temprename1 = /** @type {((inputs?: Sidebar_Temprename1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Temprename1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_temprename1(inputs)
	if (locale === "es") return __es.sidebar_temprename1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_temprename1(inputs)
	if (locale === "fr") return __fr.sidebar_temprename1(inputs)
	if (locale === "de") return __de.sidebar_temprename1(inputs)
	if (locale === "ja") return __ja.sidebar_temprename1(inputs)
	if (locale === "ko") return __ko.sidebar_temprename1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_temprename1(inputs)
	return __ru.sidebar_temprename1(inputs)
});
export { sidebar_temprename1 as "sidebar_tempRename" }
/**
* | output |
* | --- |
* | "Move up" |
*
* @param {Sidebar_Tempmoveup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempmoveup2 = /** @type {((inputs?: Sidebar_Tempmoveup2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempmoveup2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tempmoveup2(inputs)
	if (locale === "es") return __es.sidebar_tempmoveup2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tempmoveup2(inputs)
	if (locale === "fr") return __fr.sidebar_tempmoveup2(inputs)
	if (locale === "de") return __de.sidebar_tempmoveup2(inputs)
	if (locale === "ja") return __ja.sidebar_tempmoveup2(inputs)
	if (locale === "ko") return __ko.sidebar_tempmoveup2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tempmoveup2(inputs)
	return __ru.sidebar_tempmoveup2(inputs)
});
export { sidebar_tempmoveup2 as "sidebar_tempMoveUp" }
/**
* | output |
* | --- |
* | "Move down" |
*
* @param {Sidebar_Tempmovedown2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempmovedown2 = /** @type {((inputs?: Sidebar_Tempmovedown2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempmovedown2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tempmovedown2(inputs)
	if (locale === "es") return __es.sidebar_tempmovedown2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tempmovedown2(inputs)
	if (locale === "fr") return __fr.sidebar_tempmovedown2(inputs)
	if (locale === "de") return __de.sidebar_tempmovedown2(inputs)
	if (locale === "ja") return __ja.sidebar_tempmovedown2(inputs)
	if (locale === "ko") return __ko.sidebar_tempmovedown2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tempmovedown2(inputs)
	return __ru.sidebar_tempmovedown2(inputs)
});
export { sidebar_tempmovedown2 as "sidebar_tempMoveDown" }
/**
* | output |
* | --- |
* | "Duplicate" |
*
* @param {Sidebar_Tempduplicate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempduplicate1 = /** @type {((inputs?: Sidebar_Tempduplicate1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempduplicate1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tempduplicate1(inputs)
	if (locale === "es") return __es.sidebar_tempduplicate1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tempduplicate1(inputs)
	if (locale === "fr") return __fr.sidebar_tempduplicate1(inputs)
	if (locale === "de") return __de.sidebar_tempduplicate1(inputs)
	if (locale === "ja") return __ja.sidebar_tempduplicate1(inputs)
	if (locale === "ko") return __ko.sidebar_tempduplicate1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tempduplicate1(inputs)
	return __ru.sidebar_tempduplicate1(inputs)
});
export { sidebar_tempduplicate1 as "sidebar_tempDuplicate" }
/**
* | output |
* | --- |
* | "Close tab" |
*
* @param {Sidebar_Tempclosetab2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tempclosetab2 = /** @type {((inputs?: Sidebar_Tempclosetab2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tempclosetab2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tempclosetab2(inputs)
	if (locale === "es") return __es.sidebar_tempclosetab2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tempclosetab2(inputs)
	if (locale === "fr") return __fr.sidebar_tempclosetab2(inputs)
	if (locale === "de") return __de.sidebar_tempclosetab2(inputs)
	if (locale === "ja") return __ja.sidebar_tempclosetab2(inputs)
	if (locale === "ko") return __ko.sidebar_tempclosetab2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tempclosetab2(inputs)
	return __ru.sidebar_tempclosetab2(inputs)
});
export { sidebar_tempclosetab2 as "sidebar_tempCloseTab" }
/**
* | output |
* | --- |
* | "Recently archived — open in Settings" |
*
* @param {Sidebar_Archivedtooltip1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_archivedtooltip1 = /** @type {((inputs?: Sidebar_Archivedtooltip1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Archivedtooltip1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_archivedtooltip1(inputs)
	if (locale === "es") return __es.sidebar_archivedtooltip1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_archivedtooltip1(inputs)
	if (locale === "fr") return __fr.sidebar_archivedtooltip1(inputs)
	if (locale === "de") return __de.sidebar_archivedtooltip1(inputs)
	if (locale === "ja") return __ja.sidebar_archivedtooltip1(inputs)
	if (locale === "ko") return __ko.sidebar_archivedtooltip1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_archivedtooltip1(inputs)
	return __ru.sidebar_archivedtooltip1(inputs)
});
export { sidebar_archivedtooltip1 as "sidebar_archivedTooltip" }
/**
* | output |
* | --- |
* | "Recently archived ({count})" |
*
* @param {Sidebar_Archivedlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_archivedlabel1 = /** @type {((inputs: Sidebar_Archivedlabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Archivedlabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_archivedlabel1(inputs)
	if (locale === "es") return __es.sidebar_archivedlabel1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_archivedlabel1(inputs)
	if (locale === "fr") return __fr.sidebar_archivedlabel1(inputs)
	if (locale === "de") return __de.sidebar_archivedlabel1(inputs)
	if (locale === "ja") return __ja.sidebar_archivedlabel1(inputs)
	if (locale === "ko") return __ko.sidebar_archivedlabel1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_archivedlabel1(inputs)
	return __ru.sidebar_archivedlabel1(inputs)
});
export { sidebar_archivedlabel1 as "sidebar_archivedLabel" }
/**
* | output |
* | --- |
* | "Auto-archive is on." |
*
* @param {Sidebar_Autoarchiveison3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchiveison3 = /** @type {((inputs?: Sidebar_Autoarchiveison3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchiveison3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchiveison3(inputs)
	if (locale === "es") return __es.sidebar_autoarchiveison3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchiveison3(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchiveison3(inputs)
	if (locale === "de") return __de.sidebar_autoarchiveison3(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchiveison3(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchiveison3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchiveison3(inputs)
	return __ru.sidebar_autoarchiveison3(inputs)
});
export { sidebar_autoarchiveison3 as "sidebar_autoArchiveIsOn" }
/**
* | output |
* | --- |
* | "Temporary tabs left idle for {threshold} are archived automatically so your workspace stays tidy — restorable for 7 days." |
*
* @param {Sidebar_Autoarchiveexplain2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchiveexplain2 = /** @type {((inputs: Sidebar_Autoarchiveexplain2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchiveexplain2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchiveexplain2(inputs)
	if (locale === "es") return __es.sidebar_autoarchiveexplain2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchiveexplain2(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchiveexplain2(inputs)
	if (locale === "de") return __de.sidebar_autoarchiveexplain2(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchiveexplain2(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchiveexplain2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchiveexplain2(inputs)
	return __ru.sidebar_autoarchiveexplain2(inputs)
});
export { sidebar_autoarchiveexplain2 as "sidebar_autoArchiveExplain" }
/**
* | output |
* | --- |
* | "Got it" |
*
* @param {Sidebar_Autoarchivedismiss2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivedismiss2 = /** @type {((inputs?: Sidebar_Autoarchivedismiss2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivedismiss2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchivedismiss2(inputs)
	if (locale === "es") return __es.sidebar_autoarchivedismiss2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchivedismiss2(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchivedismiss2(inputs)
	if (locale === "de") return __de.sidebar_autoarchivedismiss2(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchivedismiss2(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchivedismiss2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchivedismiss2(inputs)
	return __ru.sidebar_autoarchivedismiss2(inputs)
});
export { sidebar_autoarchivedismiss2 as "sidebar_autoArchiveDismiss" }
/**
* | output |
* | --- |
* | "Manage in settings" |
*
* @param {Sidebar_Autoarchivemanage2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivemanage2 = /** @type {((inputs?: Sidebar_Autoarchivemanage2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivemanage2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_autoarchivemanage2(inputs)
	if (locale === "es") return __es.sidebar_autoarchivemanage2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_autoarchivemanage2(inputs)
	if (locale === "fr") return __fr.sidebar_autoarchivemanage2(inputs)
	if (locale === "de") return __de.sidebar_autoarchivemanage2(inputs)
	if (locale === "ja") return __ja.sidebar_autoarchivemanage2(inputs)
	if (locale === "ko") return __ko.sidebar_autoarchivemanage2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_autoarchivemanage2(inputs)
	return __ru.sidebar_autoarchivemanage2(inputs)
});
export { sidebar_autoarchivemanage2 as "sidebar_autoArchiveManage" }
/**
* | output |
* | --- |
* | "Nothing kept here yet. Open a few tabs — anything you don't pin settles out on its own." |
*
* @param {Launcher_Emptycaption1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_emptycaption1 = /** @type {((inputs?: Launcher_Emptycaption1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Emptycaption1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_emptycaption1(inputs)
	if (locale === "es") return __es.launcher_emptycaption1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_emptycaption1(inputs)
	if (locale === "fr") return __fr.launcher_emptycaption1(inputs)
	if (locale === "de") return __de.launcher_emptycaption1(inputs)
	if (locale === "ja") return __ja.launcher_emptycaption1(inputs)
	if (locale === "ko") return __ko.launcher_emptycaption1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_emptycaption1(inputs)
	return __ru.launcher_emptycaption1(inputs)
});
export { launcher_emptycaption1 as "launcher_emptyCaption" }
/**
* | tabPlural | output |
* | --- | --- |
* | "one" | "{tabCount} tab · {pinnedCount} pinned" |
* | "other" | "{tabCount} tabs · {pinnedCount} pinned" |
*
* @param {Launcher_Metaline1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_metaline1 = /** @type {((inputs: Launcher_Metaline1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Metaline1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_metaline1(inputs)
	if (locale === "es") return __es.launcher_metaline1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_metaline1(inputs)
	if (locale === "fr") return __fr.launcher_metaline1(inputs)
	if (locale === "de") return __de.launcher_metaline1(inputs)
	if (locale === "ja") return __ja.launcher_metaline1(inputs)
	if (locale === "ko") return __ko.launcher_metaline1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_metaline1(inputs)
	return __ru.launcher_metaline1(inputs)
});
export { launcher_metaline1 as "launcher_metaLine" }
/**
* | output |
* | --- |
* | "Search tabs, bookmarks…" |
*
* @param {Launcher_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_placeholder = /** @type {((inputs?: Launcher_PlaceholderInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_PlaceholderInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_placeholder(inputs)
	if (locale === "es") return __es.launcher_placeholder(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_placeholder(inputs)
	if (locale === "fr") return __fr.launcher_placeholder(inputs)
	if (locale === "de") return __de.launcher_placeholder(inputs)
	if (locale === "ja") return __ja.launcher_placeholder(inputs)
	if (locale === "ko") return __ko.launcher_placeholder(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_placeholder(inputs)
	return __ru.launcher_placeholder(inputs)
});
/**
* | output |
* | --- |
* | "Search tabs, bookmarks, and history" |
*
* @param {Launcher_Arialabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_arialabel1 = /** @type {((inputs?: Launcher_Arialabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Arialabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_arialabel1(inputs)
	if (locale === "es") return __es.launcher_arialabel1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_arialabel1(inputs)
	if (locale === "fr") return __fr.launcher_arialabel1(inputs)
	if (locale === "de") return __de.launcher_arialabel1(inputs)
	if (locale === "ja") return __ja.launcher_arialabel1(inputs)
	if (locale === "ko") return __ko.launcher_arialabel1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_arialabel1(inputs)
	return __ru.launcher_arialabel1(inputs)
});
export { launcher_arialabel1 as "launcher_ariaLabel" }
/**
* | output |
* | --- |
* | "Search {engine} for \"{query}\"" |
*
* @param {Launcher_Enginerowtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enginerowtitle2 = /** @type {((inputs: Launcher_Enginerowtitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enginerowtitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_enginerowtitle2(inputs)
	if (locale === "es") return __es.launcher_enginerowtitle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_enginerowtitle2(inputs)
	if (locale === "fr") return __fr.launcher_enginerowtitle2(inputs)
	if (locale === "de") return __de.launcher_enginerowtitle2(inputs)
	if (locale === "ja") return __ja.launcher_enginerowtitle2(inputs)
	if (locale === "ko") return __ko.launcher_enginerowtitle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_enginerowtitle2(inputs)
	return __ru.launcher_enginerowtitle2(inputs)
});
export { launcher_enginerowtitle2 as "launcher_engineRowTitle" }
/**
* | output |
* | --- |
* | "Tab to search" |
*
* @param {Launcher_Enginehintsearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enginehintsearch2 = /** @type {((inputs?: Launcher_Enginehintsearch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enginehintsearch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_enginehintsearch2(inputs)
	if (locale === "es") return __es.launcher_enginehintsearch2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_enginehintsearch2(inputs)
	if (locale === "fr") return __fr.launcher_enginehintsearch2(inputs)
	if (locale === "de") return __de.launcher_enginehintsearch2(inputs)
	if (locale === "ja") return __ja.launcher_enginehintsearch2(inputs)
	if (locale === "ko") return __ko.launcher_enginehintsearch2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_enginehintsearch2(inputs)
	return __ru.launcher_enginehintsearch2(inputs)
});
export { launcher_enginehintsearch2 as "launcher_engineHintSearch" }
/**
* | output |
* | --- |
* | "Tab to cycle" |
*
* @param {Launcher_Enginehintcycle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enginehintcycle2 = /** @type {((inputs?: Launcher_Enginehintcycle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enginehintcycle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_enginehintcycle2(inputs)
	if (locale === "es") return __es.launcher_enginehintcycle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_enginehintcycle2(inputs)
	if (locale === "fr") return __fr.launcher_enginehintcycle2(inputs)
	if (locale === "de") return __de.launcher_enginehintcycle2(inputs)
	if (locale === "ja") return __ja.launcher_enginehintcycle2(inputs)
	if (locale === "ko") return __ko.launcher_enginehintcycle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_enginehintcycle2(inputs)
	return __ru.launcher_enginehintcycle2(inputs)
});
export { launcher_enginehintcycle2 as "launcher_engineHintCycle" }
/**
* | output |
* | --- |
* | "Tab to switch" |
*
* @param {Launcher_Enginehintswitch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enginehintswitch2 = /** @type {((inputs?: Launcher_Enginehintswitch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enginehintswitch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_enginehintswitch2(inputs)
	if (locale === "es") return __es.launcher_enginehintswitch2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_enginehintswitch2(inputs)
	if (locale === "fr") return __fr.launcher_enginehintswitch2(inputs)
	if (locale === "de") return __de.launcher_enginehintswitch2(inputs)
	if (locale === "ja") return __ja.launcher_enginehintswitch2(inputs)
	if (locale === "ko") return __ko.launcher_enginehintswitch2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_enginehintswitch2(inputs)
	return __ru.launcher_enginehintswitch2(inputs)
});
export { launcher_enginehintswitch2 as "launcher_engineHintSwitch" }
/**
* | output |
* | --- |
* | "No matches" |
*
* @param {Launcher_Nomatches1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_nomatches1 = /** @type {((inputs?: Launcher_Nomatches1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Nomatches1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_nomatches1(inputs)
	if (locale === "es") return __es.launcher_nomatches1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_nomatches1(inputs)
	if (locale === "fr") return __fr.launcher_nomatches1(inputs)
	if (locale === "de") return __de.launcher_nomatches1(inputs)
	if (locale === "ja") return __ja.launcher_nomatches1(inputs)
	if (locale === "ko") return __ko.launcher_nomatches1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_nomatches1(inputs)
	return __ru.launcher_nomatches1(inputs)
});
export { launcher_nomatches1 as "launcher_noMatches" }
/**
* | output |
* | --- |
* | "↵ Open" |
*
* @param {Launcher_Actionhintopen2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_actionhintopen2 = /** @type {((inputs?: Launcher_Actionhintopen2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Actionhintopen2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_actionhintopen2(inputs)
	if (locale === "es") return __es.launcher_actionhintopen2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_actionhintopen2(inputs)
	if (locale === "fr") return __fr.launcher_actionhintopen2(inputs)
	if (locale === "de") return __de.launcher_actionhintopen2(inputs)
	if (locale === "ja") return __ja.launcher_actionhintopen2(inputs)
	if (locale === "ko") return __ko.launcher_actionhintopen2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_actionhintopen2(inputs)
	return __ru.launcher_actionhintopen2(inputs)
});
export { launcher_actionhintopen2 as "launcher_actionHintOpen" }
/**
* | output |
* | --- |
* | "↵ Switch ⇧↵ New tab" |
*
* @param {Launcher_Actionhintswitch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_actionhintswitch2 = /** @type {((inputs?: Launcher_Actionhintswitch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Actionhintswitch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_actionhintswitch2(inputs)
	if (locale === "es") return __es.launcher_actionhintswitch2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_actionhintswitch2(inputs)
	if (locale === "fr") return __fr.launcher_actionhintswitch2(inputs)
	if (locale === "de") return __de.launcher_actionhintswitch2(inputs)
	if (locale === "ja") return __ja.launcher_actionhintswitch2(inputs)
	if (locale === "ko") return __ko.launcher_actionhintswitch2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_actionhintswitch2(inputs)
	return __ru.launcher_actionhintswitch2(inputs)
});
export { launcher_actionhintswitch2 as "launcher_actionHintSwitch" }
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} result" |
* | "other" | "{count} results" |
*
* @param {Launcher_Resultstatus1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_resultstatus1 = /** @type {((inputs: Launcher_Resultstatus1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Resultstatus1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_resultstatus1(inputs)
	if (locale === "es") return __es.launcher_resultstatus1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_resultstatus1(inputs)
	if (locale === "fr") return __fr.launcher_resultstatus1(inputs)
	if (locale === "de") return __de.launcher_resultstatus1(inputs)
	if (locale === "ja") return __ja.launcher_resultstatus1(inputs)
	if (locale === "ko") return __ko.launcher_resultstatus1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_resultstatus1(inputs)
	return __ru.launcher_resultstatus1(inputs)
});
export { launcher_resultstatus1 as "launcher_resultStatus" }
/**
* | output |
* | --- |
* | "Enable history results" |
*
* @param {Launcher_Enablehistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enablehistory1 = /** @type {((inputs?: Launcher_Enablehistory1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enablehistory1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_enablehistory1(inputs)
	if (locale === "es") return __es.launcher_enablehistory1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_enablehistory1(inputs)
	if (locale === "fr") return __fr.launcher_enablehistory1(inputs)
	if (locale === "de") return __de.launcher_enablehistory1(inputs)
	if (locale === "ja") return __ja.launcher_enablehistory1(inputs)
	if (locale === "ko") return __ko.launcher_enablehistory1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_enablehistory1(inputs)
	return __ru.launcher_enablehistory1(inputs)
});
export { launcher_enablehistory1 as "launcher_enableHistory" }
/**
* | output |
* | --- |
* | "Enable bookmark results" |
*
* @param {Launcher_Enablebookmarks1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enablebookmarks1 = /** @type {((inputs?: Launcher_Enablebookmarks1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enablebookmarks1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_enablebookmarks1(inputs)
	if (locale === "es") return __es.launcher_enablebookmarks1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_enablebookmarks1(inputs)
	if (locale === "fr") return __fr.launcher_enablebookmarks1(inputs)
	if (locale === "de") return __de.launcher_enablebookmarks1(inputs)
	if (locale === "ja") return __ja.launcher_enablebookmarks1(inputs)
	if (locale === "ko") return __ko.launcher_enablebookmarks1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_enablebookmarks1(inputs)
	return __ru.launcher_enablebookmarks1(inputs)
});
export { launcher_enablebookmarks1 as "launcher_enableBookmarks" }
/**
* | output |
* | --- |
* | "No connections yet" |
*
* @param {Launcher_Lensnoconnections2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensnoconnections2 = /** @type {((inputs?: Launcher_Lensnoconnections2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensnoconnections2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensnoconnections2(inputs)
	if (locale === "es") return __es.launcher_lensnoconnections2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensnoconnections2(inputs)
	if (locale === "fr") return __fr.launcher_lensnoconnections2(inputs)
	if (locale === "de") return __de.launcher_lensnoconnections2(inputs)
	if (locale === "ja") return __ja.launcher_lensnoconnections2(inputs)
	if (locale === "ko") return __ko.launcher_lensnoconnections2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensnoconnections2(inputs)
	return __ru.launcher_lensnoconnections2(inputs)
});
export { launcher_lensnoconnections2 as "launcher_lensNoConnections" }
/**
* | output |
* | --- |
* | "Feeds — a quiet magazine" |
*
* @param {Launcher_Lensfeedssubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfeedssubtitle2 = /** @type {((inputs?: Launcher_Lensfeedssubtitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfeedssubtitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensfeedssubtitle2(inputs)
	if (locale === "es") return __es.launcher_lensfeedssubtitle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensfeedssubtitle2(inputs)
	if (locale === "fr") return __fr.launcher_lensfeedssubtitle2(inputs)
	if (locale === "de") return __de.launcher_lensfeedssubtitle2(inputs)
	if (locale === "ja") return __ja.launcher_lensfeedssubtitle2(inputs)
	if (locale === "ko") return __ko.launcher_lensfeedssubtitle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensfeedssubtitle2(inputs)
	return __ru.launcher_lensfeedssubtitle2(inputs)
});
export { launcher_lensfeedssubtitle2 as "launcher_lensFeedsSubtitle" }
/**
* | output |
* | --- |
* | "No lens to show" |
*
* @param {Launcher_Lensmissingtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensmissingtitle2 = /** @type {((inputs?: Launcher_Lensmissingtitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensmissingtitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensmissingtitle2(inputs)
	if (locale === "es") return __es.launcher_lensmissingtitle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensmissingtitle2(inputs)
	if (locale === "fr") return __fr.launcher_lensmissingtitle2(inputs)
	if (locale === "de") return __de.launcher_lensmissingtitle2(inputs)
	if (locale === "ja") return __ja.launcher_lensmissingtitle2(inputs)
	if (locale === "ko") return __ko.launcher_lensmissingtitle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensmissingtitle2(inputs)
	return __ru.launcher_lensmissingtitle2(inputs)
});
export { launcher_lensmissingtitle2 as "launcher_lensMissingTitle" }
/**
* | output |
* | --- |
* | "This page didn't get a lens to open, or that lens is no longer around." |
*
* @param {Launcher_Lensmissingcopy2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensmissingcopy2 = /** @type {((inputs?: Launcher_Lensmissingcopy2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensmissingcopy2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensmissingcopy2(inputs)
	if (locale === "es") return __es.launcher_lensmissingcopy2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensmissingcopy2(inputs)
	if (locale === "fr") return __fr.launcher_lensmissingcopy2(inputs)
	if (locale === "de") return __de.launcher_lensmissingcopy2(inputs)
	if (locale === "ja") return __ja.launcher_lensmissingcopy2(inputs)
	if (locale === "ko") return __ko.launcher_lensmissingcopy2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensmissingcopy2(inputs)
	return __ru.launcher_lensmissingcopy2(inputs)
});
export { launcher_lensmissingcopy2 as "launcher_lensMissingCopy" }
/**
* | output |
* | --- |
* | "Search tabs, bookmarks…" |
*
* @param {Launcher_Overlay_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_overlay_placeholder = /** @type {((inputs?: Launcher_Overlay_PlaceholderInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_PlaceholderInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_placeholder(inputs)
	if (locale === "es") return __es.launcher_overlay_placeholder(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_placeholder(inputs)
	if (locale === "fr") return __fr.launcher_overlay_placeholder(inputs)
	if (locale === "de") return __de.launcher_overlay_placeholder(inputs)
	if (locale === "ja") return __ja.launcher_overlay_placeholder(inputs)
	if (locale === "ko") return __ko.launcher_overlay_placeholder(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_placeholder(inputs)
	return __ru.launcher_overlay_placeholder(inputs)
});
/**
* | output |
* | --- |
* | "Search tabs, bookmarks, and history" |
*
* @param {Launcher_Overlay_Arialabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_arialabel1 = /** @type {((inputs?: Launcher_Overlay_Arialabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Arialabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_arialabel1(inputs)
	if (locale === "es") return __es.launcher_overlay_arialabel1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_arialabel1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_arialabel1(inputs)
	if (locale === "de") return __de.launcher_overlay_arialabel1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_arialabel1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_arialabel1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_arialabel1(inputs)
	return __ru.launcher_overlay_arialabel1(inputs)
});
export { launcher_overlay_arialabel1 as "launcher_overlay_ariaLabel" }
/**
* | output |
* | --- |
* | "Lunma launcher" |
*
* @param {Launcher_Overlay_Dialoglabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_dialoglabel1 = /** @type {((inputs?: Launcher_Overlay_Dialoglabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Dialoglabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_dialoglabel1(inputs)
	if (locale === "es") return __es.launcher_overlay_dialoglabel1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_dialoglabel1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_dialoglabel1(inputs)
	if (locale === "de") return __de.launcher_overlay_dialoglabel1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_dialoglabel1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_dialoglabel1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_dialoglabel1(inputs)
	return __ru.launcher_overlay_dialoglabel1(inputs)
});
export { launcher_overlay_dialoglabel1 as "launcher_overlay_dialogLabel" }
/**
* | output |
* | --- |
* | "Exit {engine} search" |
*
* @param {Launcher_Overlay_Exitengine1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_exitengine1 = /** @type {((inputs: Launcher_Overlay_Exitengine1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Exitengine1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_exitengine1(inputs)
	if (locale === "es") return __es.launcher_overlay_exitengine1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_exitengine1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_exitengine1(inputs)
	if (locale === "de") return __de.launcher_overlay_exitengine1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_exitengine1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_exitengine1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_exitengine1(inputs)
	return __ru.launcher_overlay_exitengine1(inputs)
});
export { launcher_overlay_exitengine1 as "launcher_overlay_exitEngine" }
/**
* | output |
* | --- |
* | "Tab to search" |
*
* @param {Launcher_Overlay_Tabhintsearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_tabhintsearch2 = /** @type {((inputs?: Launcher_Overlay_Tabhintsearch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Tabhintsearch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_tabhintsearch2(inputs)
	if (locale === "es") return __es.launcher_overlay_tabhintsearch2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_tabhintsearch2(inputs)
	if (locale === "fr") return __fr.launcher_overlay_tabhintsearch2(inputs)
	if (locale === "de") return __de.launcher_overlay_tabhintsearch2(inputs)
	if (locale === "ja") return __ja.launcher_overlay_tabhintsearch2(inputs)
	if (locale === "ko") return __ko.launcher_overlay_tabhintsearch2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_tabhintsearch2(inputs)
	return __ru.launcher_overlay_tabhintsearch2(inputs)
});
export { launcher_overlay_tabhintsearch2 as "launcher_overlay_tabHintSearch" }
/**
* | output |
* | --- |
* | "Tab to cycle" |
*
* @param {Launcher_Overlay_Tabhintcycle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_tabhintcycle2 = /** @type {((inputs?: Launcher_Overlay_Tabhintcycle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Tabhintcycle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_tabhintcycle2(inputs)
	if (locale === "es") return __es.launcher_overlay_tabhintcycle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_tabhintcycle2(inputs)
	if (locale === "fr") return __fr.launcher_overlay_tabhintcycle2(inputs)
	if (locale === "de") return __de.launcher_overlay_tabhintcycle2(inputs)
	if (locale === "ja") return __ja.launcher_overlay_tabhintcycle2(inputs)
	if (locale === "ko") return __ko.launcher_overlay_tabhintcycle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_tabhintcycle2(inputs)
	return __ru.launcher_overlay_tabhintcycle2(inputs)
});
export { launcher_overlay_tabhintcycle2 as "launcher_overlay_tabHintCycle" }
/**
* | output |
* | --- |
* | "Tab to switch" |
*
* @param {Launcher_Overlay_Tabhintswitch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_tabhintswitch2 = /** @type {((inputs?: Launcher_Overlay_Tabhintswitch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Tabhintswitch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_tabhintswitch2(inputs)
	if (locale === "es") return __es.launcher_overlay_tabhintswitch2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_tabhintswitch2(inputs)
	if (locale === "fr") return __fr.launcher_overlay_tabhintswitch2(inputs)
	if (locale === "de") return __de.launcher_overlay_tabhintswitch2(inputs)
	if (locale === "ja") return __ja.launcher_overlay_tabhintswitch2(inputs)
	if (locale === "ko") return __ko.launcher_overlay_tabhintswitch2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_tabhintswitch2(inputs)
	return __ru.launcher_overlay_tabhintswitch2(inputs)
});
export { launcher_overlay_tabhintswitch2 as "launcher_overlay_tabHintSwitch" }
/**
* | output |
* | --- |
* | "No matches" |
*
* @param {Launcher_Overlay_Nomatches1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_nomatches1 = /** @type {((inputs?: Launcher_Overlay_Nomatches1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Nomatches1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_nomatches1(inputs)
	if (locale === "es") return __es.launcher_overlay_nomatches1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_nomatches1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_nomatches1(inputs)
	if (locale === "de") return __de.launcher_overlay_nomatches1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_nomatches1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_nomatches1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_nomatches1(inputs)
	return __ru.launcher_overlay_nomatches1(inputs)
});
export { launcher_overlay_nomatches1 as "launcher_overlay_noMatches" }
/**
* | output |
* | --- |
* | "already open" |
*
* @param {Launcher_Overlay_Alreadyopen1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_alreadyopen1 = /** @type {((inputs?: Launcher_Overlay_Alreadyopen1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Alreadyopen1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_alreadyopen1(inputs)
	if (locale === "es") return __es.launcher_overlay_alreadyopen1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_alreadyopen1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_alreadyopen1(inputs)
	if (locale === "de") return __de.launcher_overlay_alreadyopen1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_alreadyopen1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_alreadyopen1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_alreadyopen1(inputs)
	return __ru.launcher_overlay_alreadyopen1(inputs)
});
export { launcher_overlay_alreadyopen1 as "launcher_overlay_alreadyOpen" }
/**
* | output |
* | --- |
* | "Switch" |
*
* @param {Launcher_Overlay_SwitchInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_overlay_switch = /** @type {((inputs?: Launcher_Overlay_SwitchInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_SwitchInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_switch(inputs)
	if (locale === "es") return __es.launcher_overlay_switch(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_switch(inputs)
	if (locale === "fr") return __fr.launcher_overlay_switch(inputs)
	if (locale === "de") return __de.launcher_overlay_switch(inputs)
	if (locale === "ja") return __ja.launcher_overlay_switch(inputs)
	if (locale === "ko") return __ko.launcher_overlay_switch(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_switch(inputs)
	return __ru.launcher_overlay_switch(inputs)
});
/**
* | output |
* | --- |
* | "New tab" |
*
* @param {Launcher_Overlay_Newtab1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_newtab1 = /** @type {((inputs?: Launcher_Overlay_Newtab1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Newtab1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_newtab1(inputs)
	if (locale === "es") return __es.launcher_overlay_newtab1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_newtab1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_newtab1(inputs)
	if (locale === "de") return __de.launcher_overlay_newtab1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_newtab1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_newtab1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_newtab1(inputs)
	return __ru.launcher_overlay_newtab1(inputs)
});
export { launcher_overlay_newtab1 as "launcher_overlay_newTab" }
/**
* | output |
* | --- |
* | "Open" |
*
* @param {Launcher_Overlay_OpenInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_overlay_open = /** @type {((inputs?: Launcher_Overlay_OpenInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_OpenInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_open(inputs)
	if (locale === "es") return __es.launcher_overlay_open(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_open(inputs)
	if (locale === "fr") return __fr.launcher_overlay_open(inputs)
	if (locale === "de") return __de.launcher_overlay_open(inputs)
	if (locale === "ja") return __ja.launcher_overlay_open(inputs)
	if (locale === "ko") return __ko.launcher_overlay_open(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_open(inputs)
	return __ru.launcher_overlay_open(inputs)
});
/**
* | output |
* | --- |
* | "Enable history results" |
*
* @param {Launcher_Overlay_Enablehistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_enablehistory1 = /** @type {((inputs?: Launcher_Overlay_Enablehistory1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Enablehistory1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_enablehistory1(inputs)
	if (locale === "es") return __es.launcher_overlay_enablehistory1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_enablehistory1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_enablehistory1(inputs)
	if (locale === "de") return __de.launcher_overlay_enablehistory1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_enablehistory1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_enablehistory1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_enablehistory1(inputs)
	return __ru.launcher_overlay_enablehistory1(inputs)
});
export { launcher_overlay_enablehistory1 as "launcher_overlay_enableHistory" }
/**
* | output |
* | --- |
* | "Enable bookmark results" |
*
* @param {Launcher_Overlay_Enablebookmarks1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_overlay_enablebookmarks1 = /** @type {((inputs?: Launcher_Overlay_Enablebookmarks1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_Enablebookmarks1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_overlay_enablebookmarks1(inputs)
	if (locale === "es") return __es.launcher_overlay_enablebookmarks1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_overlay_enablebookmarks1(inputs)
	if (locale === "fr") return __fr.launcher_overlay_enablebookmarks1(inputs)
	if (locale === "de") return __de.launcher_overlay_enablebookmarks1(inputs)
	if (locale === "ja") return __ja.launcher_overlay_enablebookmarks1(inputs)
	if (locale === "ko") return __ko.launcher_overlay_enablebookmarks1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_overlay_enablebookmarks1(inputs)
	return __ru.launcher_overlay_enablebookmarks1(inputs)
});
export { launcher_overlay_enablebookmarks1 as "launcher_overlay_enableBookmarks" }
/**
* | output |
* | --- |
* | "How the launcher finds, ranks, and opens what you type." |
*
* @param {Options_Searchgroupintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_searchgroupintro2 = /** @type {((inputs?: Options_Searchgroupintro2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Searchgroupintro2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_searchgroupintro2(inputs)
	if (locale === "es") return __es.options_searchgroupintro2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_searchgroupintro2(inputs)
	if (locale === "fr") return __fr.options_searchgroupintro2(inputs)
	if (locale === "de") return __de.options_searchgroupintro2(inputs)
	if (locale === "ja") return __ja.options_searchgroupintro2(inputs)
	if (locale === "ko") return __ko.options_searchgroupintro2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_searchgroupintro2(inputs)
	return __ru.options_searchgroupintro2(inputs)
});
export { options_searchgroupintro2 as "options_searchGroupIntro" }
/**
* | output |
* | --- |
* | "Theme, colour, motion, and density — across every Lunma surface." |
*
* @param {Options_Appearancegroupintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_appearancegroupintro2 = /** @type {((inputs?: Options_Appearancegroupintro2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Appearancegroupintro2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_appearancegroupintro2(inputs)
	if (locale === "es") return __es.options_appearancegroupintro2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_appearancegroupintro2(inputs)
	if (locale === "fr") return __fr.options_appearancegroupintro2(inputs)
	if (locale === "de") return __de.options_appearancegroupintro2(inputs)
	if (locale === "ja") return __ja.options_appearancegroupintro2(inputs)
	if (locale === "ko") return __ko.options_appearancegroupintro2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_appearancegroupintro2(inputs)
	return __ru.options_appearancegroupintro2(inputs)
});
export { options_appearancegroupintro2 as "options_appearanceGroupIntro" }
/**
* | output |
* | --- |
* | "How tabs open, dedupe, and stay on their site." |
*
* @param {Options_Tabsgroupintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_tabsgroupintro2 = /** @type {((inputs?: Options_Tabsgroupintro2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tabsgroupintro2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_tabsgroupintro2(inputs)
	if (locale === "es") return __es.options_tabsgroupintro2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_tabsgroupintro2(inputs)
	if (locale === "fr") return __fr.options_tabsgroupintro2(inputs)
	if (locale === "de") return __de.options_tabsgroupintro2(inputs)
	if (locale === "ja") return __ja.options_tabsgroupintro2(inputs)
	if (locale === "ko") return __ko.options_tabsgroupintro2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_tabsgroupintro2(inputs)
	return __ru.options_tabsgroupintro2(inputs)
});
export { options_tabsgroupintro2 as "options_tabsGroupIntro" }
/**
* | output |
* | --- |
* | "Tidy idle tabs away on their own — only temporary tabs, never your pinned ones — and restore them whenever you need." |
*
* @param {Options_Autoarchivegroupintro3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_autoarchivegroupintro3 = /** @type {((inputs?: Options_Autoarchivegroupintro3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Autoarchivegroupintro3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_autoarchivegroupintro3(inputs)
	if (locale === "es") return __es.options_autoarchivegroupintro3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_autoarchivegroupintro3(inputs)
	if (locale === "fr") return __fr.options_autoarchivegroupintro3(inputs)
	if (locale === "de") return __de.options_autoarchivegroupintro3(inputs)
	if (locale === "ja") return __ja.options_autoarchivegroupintro3(inputs)
	if (locale === "ko") return __ko.options_autoarchivegroupintro3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_autoarchivegroupintro3(inputs)
	return __ru.options_autoarchivegroupintro3(inputs)
});
export { options_autoarchivegroupintro3 as "options_autoArchiveGroupIntro" }
/**
* | output |
* | --- |
* | "Privacy policy" |
*
* @param {Options_Privacylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_privacylink1 = /** @type {((inputs?: Options_Privacylink1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Privacylink1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_privacylink1(inputs)
	if (locale === "es") return __es.options_privacylink1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_privacylink1(inputs)
	if (locale === "fr") return __fr.options_privacylink1(inputs)
	if (locale === "de") return __de.options_privacylink1(inputs)
	if (locale === "ja") return __ja.options_privacylink1(inputs)
	if (locale === "ko") return __ko.options_privacylink1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_privacylink1(inputs)
	return __ru.options_privacylink1(inputs)
});
export { options_privacylink1 as "options_privacyLink" }
/**
* | output |
* | --- |
* | "Include %s where the query goes." |
*
* @param {Options_Customurlhint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_customurlhint2 = /** @type {((inputs?: Options_Customurlhint2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Customurlhint2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_customurlhint2(inputs)
	if (locale === "es") return __es.options_customurlhint2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_customurlhint2(inputs)
	if (locale === "fr") return __fr.options_customurlhint2(inputs)
	if (locale === "de") return __de.options_customurlhint2(inputs)
	if (locale === "ja") return __ja.options_customurlhint2(inputs)
	if (locale === "ko") return __ko.options_customurlhint2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_customurlhint2(inputs)
	return __ru.options_customurlhint2(inputs)
});
export { options_customurlhint2 as "options_customUrlHint" }
/**
* | output |
* | --- |
* | "{keyword} is a built-in keyword — the built-in wins." |
*
* @param {Options_Customkeywordcollision2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_customkeywordcollision2 = /** @type {((inputs: Options_Customkeywordcollision2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Customkeywordcollision2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_customkeywordcollision2(inputs)
	if (locale === "es") return __es.options_customkeywordcollision2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_customkeywordcollision2(inputs)
	if (locale === "fr") return __fr.options_customkeywordcollision2(inputs)
	if (locale === "de") return __de.options_customkeywordcollision2(inputs)
	if (locale === "ja") return __ja.options_customkeywordcollision2(inputs)
	if (locale === "ko") return __ko.options_customkeywordcollision2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_customkeywordcollision2(inputs)
	return __ru.options_customkeywordcollision2(inputs)
});
export { options_customkeywordcollision2 as "options_customKeywordCollision" }
/**
* | output |
* | --- |
* | "Move your Spaces to another machine, or keep a copy." |
*
* @param {Options_Backupdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_backupdescription1 = /** @type {((inputs?: Options_Backupdescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Backupdescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_backupdescription1(inputs)
	if (locale === "es") return __es.options_backupdescription1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_backupdescription1(inputs)
	if (locale === "fr") return __fr.options_backupdescription1(inputs)
	if (locale === "de") return __de.options_backupdescription1(inputs)
	if (locale === "ja") return __ja.options_backupdescription1(inputs)
	if (locale === "ko") return __ko.options_backupdescription1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_backupdescription1(inputs)
	return __ru.options_backupdescription1(inputs)
});
export { options_backupdescription1 as "options_backupDescription" }
/**
* | output |
* | --- |
* | "Carry your preferences to the new machine." |
*
* @param {Options_Includesettingsdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_includesettingsdescription2 = /** @type {((inputs?: Options_Includesettingsdescription2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Includesettingsdescription2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_includesettingsdescription2(inputs)
	if (locale === "es") return __es.options_includesettingsdescription2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_includesettingsdescription2(inputs)
	if (locale === "fr") return __fr.options_includesettingsdescription2(inputs)
	if (locale === "de") return __de.options_includesettingsdescription2(inputs)
	if (locale === "ja") return __ja.options_includesettingsdescription2(inputs)
	if (locale === "ko") return __ko.options_includesettingsdescription2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_includesettingsdescription2(inputs)
	return __ru.options_includesettingsdescription2(inputs)
});
export { options_includesettingsdescription2 as "options_includeSettingsDescription" }
/**
* | output |
* | --- |
* | "Export backup" |
*
* @param {Options_Exportbackup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_exportbackup1 = /** @type {((inputs?: Options_Exportbackup1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Exportbackup1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_exportbackup1(inputs)
	if (locale === "es") return __es.options_exportbackup1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_exportbackup1(inputs)
	if (locale === "fr") return __fr.options_exportbackup1(inputs)
	if (locale === "de") return __de.options_exportbackup1(inputs)
	if (locale === "ja") return __ja.options_exportbackup1(inputs)
	if (locale === "ko") return __ko.options_exportbackup1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_exportbackup1(inputs)
	return __ru.options_exportbackup1(inputs)
});
export { options_exportbackup1 as "options_exportBackup" }
/**
* | output |
* | --- |
* | "Replace your data? This cannot be undone." |
*
* @param {Options_Importconfirm1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importconfirm1 = /** @type {((inputs?: Options_Importconfirm1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importconfirm1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_importconfirm1(inputs)
	if (locale === "es") return __es.options_importconfirm1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_importconfirm1(inputs)
	if (locale === "fr") return __fr.options_importconfirm1(inputs)
	if (locale === "de") return __de.options_importconfirm1(inputs)
	if (locale === "ja") return __ja.options_importconfirm1(inputs)
	if (locale === "ko") return __ko.options_importconfirm1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_importconfirm1(inputs)
	return __ru.options_importconfirm1(inputs)
});
export { options_importconfirm1 as "options_importConfirm" }
/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Options_Importcancel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importcancel1 = /** @type {((inputs?: Options_Importcancel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importcancel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_importcancel1(inputs)
	if (locale === "es") return __es.options_importcancel1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_importcancel1(inputs)
	if (locale === "fr") return __fr.options_importcancel1(inputs)
	if (locale === "de") return __de.options_importcancel1(inputs)
	if (locale === "ja") return __ja.options_importcancel1(inputs)
	if (locale === "ko") return __ko.options_importcancel1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_importcancel1(inputs)
	return __ru.options_importcancel1(inputs)
});
export { options_importcancel1 as "options_importCancel" }
/**
* | output |
* | --- |
* | "Restore" |
*
* @param {Options_Importrestore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importrestore1 = /** @type {((inputs?: Options_Importrestore1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importrestore1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_importrestore1(inputs)
	if (locale === "es") return __es.options_importrestore1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_importrestore1(inputs)
	if (locale === "fr") return __fr.options_importrestore1(inputs)
	if (locale === "de") return __de.options_importrestore1(inputs)
	if (locale === "ja") return __ja.options_importrestore1(inputs)
	if (locale === "ko") return __ko.options_importrestore1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_importrestore1(inputs)
	return __ru.options_importrestore1(inputs)
});
export { options_importrestore1 as "options_importRestore" }
/**
* | output |
* | --- |
* | "Import backup" |
*
* @param {Options_Importbackup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importbackup1 = /** @type {((inputs?: Options_Importbackup1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importbackup1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_importbackup1(inputs)
	if (locale === "es") return __es.options_importbackup1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_importbackup1(inputs)
	if (locale === "fr") return __fr.options_importbackup1(inputs)
	if (locale === "de") return __de.options_importbackup1(inputs)
	if (locale === "ja") return __ja.options_importbackup1(inputs)
	if (locale === "ko") return __ko.options_importbackup1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_importbackup1(inputs)
	return __ru.options_importbackup1(inputs)
});
export { options_importbackup1 as "options_importBackup" }
/**
* | output |
* | --- |
* | "Backup exported" |
*
* @param {Options_Backupexported1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_backupexported1 = /** @type {((inputs?: Options_Backupexported1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Backupexported1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_backupexported1(inputs)
	if (locale === "es") return __es.options_backupexported1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_backupexported1(inputs)
	if (locale === "fr") return __fr.options_backupexported1(inputs)
	if (locale === "de") return __de.options_backupexported1(inputs)
	if (locale === "ja") return __ja.options_backupexported1(inputs)
	if (locale === "ko") return __ko.options_backupexported1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_backupexported1(inputs)
	return __ru.options_backupexported1(inputs)
});
export { options_backupexported1 as "options_backupExported" }
/**
* | output |
* | --- |
* | "Backup restored" |
*
* @param {Options_Backuprestored1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_backuprestored1 = /** @type {((inputs?: Options_Backuprestored1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Backuprestored1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_backuprestored1(inputs)
	if (locale === "es") return __es.options_backuprestored1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_backuprestored1(inputs)
	if (locale === "fr") return __fr.options_backuprestored1(inputs)
	if (locale === "de") return __de.options_backuprestored1(inputs)
	if (locale === "ja") return __ja.options_backuprestored1(inputs)
	if (locale === "ko") return __ko.options_backuprestored1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_backuprestored1(inputs)
	return __ru.options_backuprestored1(inputs)
});
export { options_backuprestored1 as "options_backupRestored" }
/**
* | output |
* | --- |
* | "Could not read the backup file." |
*
* @param {Options_Importreaderror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importreaderror2 = /** @type {((inputs?: Options_Importreaderror2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importreaderror2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_importreaderror2(inputs)
	if (locale === "es") return __es.options_importreaderror2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_importreaderror2(inputs)
	if (locale === "fr") return __fr.options_importreaderror2(inputs)
	if (locale === "de") return __de.options_importreaderror2(inputs)
	if (locale === "ja") return __ja.options_importreaderror2(inputs)
	if (locale === "ko") return __ko.options_importreaderror2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_importreaderror2(inputs)
	return __ru.options_importreaderror2(inputs)
});
export { options_importreaderror2 as "options_importReadError" }
/**
* | output |
* | --- |
* | "Invalid backup file — it may be corrupt or from an incompatible version." |
*
* @param {Options_Importinvaliderror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importinvaliderror2 = /** @type {((inputs?: Options_Importinvaliderror2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importinvaliderror2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_importinvaliderror2(inputs)
	if (locale === "es") return __es.options_importinvaliderror2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_importinvaliderror2(inputs)
	if (locale === "fr") return __fr.options_importinvaliderror2(inputs)
	if (locale === "de") return __de.options_importinvaliderror2(inputs)
	if (locale === "ja") return __ja.options_importinvaliderror2(inputs)
	if (locale === "ko") return __ko.options_importinvaliderror2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_importinvaliderror2(inputs)
	return __ru.options_importinvaliderror2(inputs)
});
export { options_importinvaliderror2 as "options_importInvalidError" }
/**
* | output |
* | --- |
* | "Import failed — the file may be corrupt or from an incompatible version." |
*
* @param {Options_Importfailederror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_importfailederror2 = /** @type {((inputs?: Options_Importfailederror2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Importfailederror2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_importfailederror2(inputs)
	if (locale === "es") return __es.options_importfailederror2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_importfailederror2(inputs)
	if (locale === "fr") return __fr.options_importfailederror2(inputs)
	if (locale === "de") return __de.options_importfailederror2(inputs)
	if (locale === "ja") return __ja.options_importfailederror2(inputs)
	if (locale === "ko") return __ko.options_importfailederror2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_importfailederror2(inputs)
	return __ru.options_importfailederror2(inputs)
});
export { options_importfailederror2 as "options_importFailedError" }
/**
* | output |
* | --- |
* | "Connect a service once, then reuse it in any lens. GitLab and Jira ride your browser's sign-in by default; GitHub needs a token. RSS feeds are public URLs — ..." |
*
* @param {Options_Connectionsdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connectionsdescription1 = /** @type {((inputs?: Options_Connectionsdescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connectionsdescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_connectionsdescription1(inputs)
	if (locale === "es") return __es.options_connectionsdescription1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_connectionsdescription1(inputs)
	if (locale === "fr") return __fr.options_connectionsdescription1(inputs)
	if (locale === "de") return __de.options_connectionsdescription1(inputs)
	if (locale === "ja") return __ja.options_connectionsdescription1(inputs)
	if (locale === "ko") return __ko.options_connectionsdescription1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_connectionsdescription1(inputs)
	return __ru.options_connectionsdescription1(inputs)
});
export { options_connectionsdescription1 as "options_connectionsDescription" }
/**
* | output |
* | --- |
* | "sign-in identities, reused everywhere" |
*
* @param {Options_Accountsmetadescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountsmetadescription2 = /** @type {((inputs?: Options_Accountsmetadescription2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountsmetadescription2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_accountsmetadescription2(inputs)
	if (locale === "es") return __es.options_accountsmetadescription2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_accountsmetadescription2(inputs)
	if (locale === "fr") return __fr.options_accountsmetadescription2(inputs)
	if (locale === "de") return __de.options_accountsmetadescription2(inputs)
	if (locale === "ja") return __ja.options_accountsmetadescription2(inputs)
	if (locale === "ko") return __ko.options_accountsmetadescription2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_accountsmetadescription2(inputs)
	return __ru.options_accountsmetadescription2(inputs)
});
export { options_accountsmetadescription2 as "options_accountsMetaDescription" }
/**
* | output |
* | --- |
* | "No accounts yet." |
*
* @param {Options_Noaccounts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_noaccounts1 = /** @type {((inputs?: Options_Noaccounts1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Noaccounts1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_noaccounts1(inputs)
	if (locale === "es") return __es.options_noaccounts1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_noaccounts1(inputs)
	if (locale === "fr") return __fr.options_noaccounts1(inputs)
	if (locale === "de") return __de.options_noaccounts1(inputs)
	if (locale === "ja") return __ja.options_noaccounts1(inputs)
	if (locale === "ko") return __ko.options_noaccounts1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_noaccounts1(inputs)
	return __ru.options_noaccounts1(inputs)
});
export { options_noaccounts1 as "options_noAccounts" }
/**
* | output |
* | --- |
* | "Replace token" |
*
* @param {Options_Accountreplacetoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountreplacetoken2 = /** @type {((inputs?: Options_Accountreplacetoken2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountreplacetoken2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_accountreplacetoken2(inputs)
	if (locale === "es") return __es.options_accountreplacetoken2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_accountreplacetoken2(inputs)
	if (locale === "fr") return __fr.options_accountreplacetoken2(inputs)
	if (locale === "de") return __de.options_accountreplacetoken2(inputs)
	if (locale === "ja") return __ja.options_accountreplacetoken2(inputs)
	if (locale === "ko") return __ko.options_accountreplacetoken2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_accountreplacetoken2(inputs)
	return __ru.options_accountreplacetoken2(inputs)
});
export { options_accountreplacetoken2 as "options_accountReplaceToken" }
/**
* | output |
* | --- |
* | "Add token" |
*
* @param {Options_Accountaddtoken2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountaddtoken2 = /** @type {((inputs?: Options_Accountaddtoken2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountaddtoken2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_accountaddtoken2(inputs)
	if (locale === "es") return __es.options_accountaddtoken2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_accountaddtoken2(inputs)
	if (locale === "fr") return __fr.options_accountaddtoken2(inputs)
	if (locale === "de") return __de.options_accountaddtoken2(inputs)
	if (locale === "ja") return __ja.options_accountaddtoken2(inputs)
	if (locale === "ko") return __ko.options_accountaddtoken2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_accountaddtoken2(inputs)
	return __ru.options_accountaddtoken2(inputs)
});
export { options_accountaddtoken2 as "options_accountAddToken" }
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Options_Accountrename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountrename1 = /** @type {((inputs?: Options_Accountrename1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountrename1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_accountrename1(inputs)
	if (locale === "es") return __es.options_accountrename1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_accountrename1(inputs)
	if (locale === "fr") return __fr.options_accountrename1(inputs)
	if (locale === "de") return __de.options_accountrename1(inputs)
	if (locale === "ja") return __ja.options_accountrename1(inputs)
	if (locale === "ko") return __ko.options_accountrename1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_accountrename1(inputs)
	return __ru.options_accountrename1(inputs)
});
export { options_accountrename1 as "options_accountRename" }
/**
* | output |
* | --- |
* | "Disconnect" |
*
* @param {Options_Accountdisconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountdisconnect1 = /** @type {((inputs?: Options_Accountdisconnect1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountdisconnect1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_accountdisconnect1(inputs)
	if (locale === "es") return __es.options_accountdisconnect1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_accountdisconnect1(inputs)
	if (locale === "fr") return __fr.options_accountdisconnect1(inputs)
	if (locale === "de") return __de.options_accountdisconnect1(inputs)
	if (locale === "ja") return __ja.options_accountdisconnect1(inputs)
	if (locale === "ko") return __ko.options_accountdisconnect1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_accountdisconnect1(inputs)
	return __ru.options_accountdisconnect1(inputs)
});
export { options_accountdisconnect1 as "options_accountDisconnect" }
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Options_Feedrename1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedrename1 = /** @type {((inputs?: Options_Feedrename1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedrename1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_feedrename1(inputs)
	if (locale === "es") return __es.options_feedrename1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_feedrename1(inputs)
	if (locale === "fr") return __fr.options_feedrename1(inputs)
	if (locale === "de") return __de.options_feedrename1(inputs)
	if (locale === "ja") return __ja.options_feedrename1(inputs)
	if (locale === "ko") return __ko.options_feedrename1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_feedrename1(inputs)
	return __ru.options_feedrename1(inputs)
});
export { options_feedrename1 as "options_feedRename" }
/**
* | output |
* | --- |
* | "Copy URL" |
*
* @param {Options_Feedcopyurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedcopyurl2 = /** @type {((inputs?: Options_Feedcopyurl2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedcopyurl2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_feedcopyurl2(inputs)
	if (locale === "es") return __es.options_feedcopyurl2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_feedcopyurl2(inputs)
	if (locale === "fr") return __fr.options_feedcopyurl2(inputs)
	if (locale === "de") return __de.options_feedcopyurl2(inputs)
	if (locale === "ja") return __ja.options_feedcopyurl2(inputs)
	if (locale === "ko") return __ko.options_feedcopyurl2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_feedcopyurl2(inputs)
	return __ru.options_feedcopyurl2(inputs)
});
export { options_feedcopyurl2 as "options_feedCopyUrl" }
/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Options_Feedremove1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedremove1 = /** @type {((inputs?: Options_Feedremove1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedremove1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_feedremove1(inputs)
	if (locale === "es") return __es.options_feedremove1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_feedremove1(inputs)
	if (locale === "fr") return __fr.options_feedremove1(inputs)
	if (locale === "de") return __de.options_feedremove1(inputs)
	if (locale === "ja") return __ja.options_feedremove1(inputs)
	if (locale === "ko") return __ko.options_feedremove1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_feedremove1(inputs)
	return __ru.options_feedremove1(inputs)
});
export { options_feedremove1 as "options_feedRemove" }
/**
* | output |
* | --- |
* | "Feeds" |
*
* @param {Options_Feedsgrouptitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedsgrouptitle2 = /** @type {((inputs?: Options_Feedsgrouptitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedsgrouptitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_feedsgrouptitle2(inputs)
	if (locale === "es") return __es.options_feedsgrouptitle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_feedsgrouptitle2(inputs)
	if (locale === "fr") return __fr.options_feedsgrouptitle2(inputs)
	if (locale === "de") return __de.options_feedsgrouptitle2(inputs)
	if (locale === "ja") return __ja.options_feedsgrouptitle2(inputs)
	if (locale === "ko") return __ko.options_feedsgrouptitle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_feedsgrouptitle2(inputs)
	return __ru.options_feedsgrouptitle2(inputs)
});
export { options_feedsgrouptitle2 as "options_feedsGroupTitle" }
/**
* | output |
* | --- |
* | "Export OPML" |
*
* @param {Options_Exportopml1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_exportopml1 = /** @type {((inputs?: Options_Exportopml1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Exportopml1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_exportopml1(inputs)
	if (locale === "es") return __es.options_exportopml1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_exportopml1(inputs)
	if (locale === "fr") return __fr.options_exportopml1(inputs)
	if (locale === "de") return __de.options_exportopml1(inputs)
	if (locale === "ja") return __ja.options_exportopml1(inputs)
	if (locale === "ko") return __ko.options_exportopml1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_exportopml1(inputs)
	return __ru.options_exportopml1(inputs)
});
export { options_exportopml1 as "options_exportOpml" }
/**
* | output |
* | --- |
* | "No feeds yet." |
*
* @param {Options_Nofeeds1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_nofeeds1 = /** @type {((inputs?: Options_Nofeeds1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Nofeeds1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_nofeeds1(inputs)
	if (locale === "es") return __es.options_nofeeds1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_nofeeds1(inputs)
	if (locale === "fr") return __fr.options_nofeeds1(inputs)
	if (locale === "de") return __de.options_nofeeds1(inputs)
	if (locale === "ja") return __ja.options_nofeeds1(inputs)
	if (locale === "ko") return __ko.options_nofeeds1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_nofeeds1(inputs)
	return __ru.options_nofeeds1(inputs)
});
export { options_nofeeds1 as "options_noFeeds" }
/**
* | output |
* | --- |
* | "+ Connect" |
*
* @param {Options_Connecttoggleconnect2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connecttoggleconnect2 = /** @type {((inputs?: Options_Connecttoggleconnect2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connecttoggleconnect2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_connecttoggleconnect2(inputs)
	if (locale === "es") return __es.options_connecttoggleconnect2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_connecttoggleconnect2(inputs)
	if (locale === "fr") return __fr.options_connecttoggleconnect2(inputs)
	if (locale === "de") return __de.options_connecttoggleconnect2(inputs)
	if (locale === "ja") return __ja.options_connecttoggleconnect2(inputs)
	if (locale === "ko") return __ko.options_connecttoggleconnect2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_connecttoggleconnect2(inputs)
	return __ru.options_connecttoggleconnect2(inputs)
});
export { options_connecttoggleconnect2 as "options_connectToggleConnect" }
/**
* | output |
* | --- |
* | "Close" |
*
* @param {Options_Connecttoggleclose2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connecttoggleclose2 = /** @type {((inputs?: Options_Connecttoggleclose2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connecttoggleclose2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_connecttoggleclose2(inputs)
	if (locale === "es") return __es.options_connecttoggleclose2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_connecttoggleclose2(inputs)
	if (locale === "fr") return __fr.options_connecttoggleclose2(inputs)
	if (locale === "de") return __de.options_connecttoggleclose2(inputs)
	if (locale === "ja") return __ja.options_connecttoggleclose2(inputs)
	if (locale === "ko") return __ko.options_connecttoggleclose2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_connecttoggleclose2(inputs)
	return __ru.options_connecttoggleclose2(inputs)
});
export { options_connecttoggleclose2 as "options_connectToggleClose" }
/**
* | output |
* | --- |
* | "Feed URL copied" |
*
* @param {Options_Feedurlcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedurlcopied2 = /** @type {((inputs?: Options_Feedurlcopied2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedurlcopied2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_feedurlcopied2(inputs)
	if (locale === "es") return __es.options_feedurlcopied2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_feedurlcopied2(inputs)
	if (locale === "fr") return __fr.options_feedurlcopied2(inputs)
	if (locale === "de") return __de.options_feedurlcopied2(inputs)
	if (locale === "ja") return __ja.options_feedurlcopied2(inputs)
	if (locale === "ko") return __ko.options_feedurlcopied2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_feedurlcopied2(inputs)
	return __ru.options_feedurlcopied2(inputs)
});
export { options_feedurlcopied2 as "options_feedUrlCopied" }
/**
* | output |
* | --- |
* | "Not used yet" |
*
* @param {Options_Reachnotused2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_reachnotused2 = /** @type {((inputs?: Options_Reachnotused2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Reachnotused2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_reachnotused2(inputs)
	if (locale === "es") return __es.options_reachnotused2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_reachnotused2(inputs)
	if (locale === "fr") return __fr.options_reachnotused2(inputs)
	if (locale === "de") return __de.options_reachnotused2(inputs)
	if (locale === "ja") return __ja.options_reachnotused2(inputs)
	if (locale === "ko") return __ko.options_reachnotused2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_reachnotused2(inputs)
	return __ru.options_reachnotused2(inputs)
});
export { options_reachnotused2 as "options_reachNotUsed" }
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Used in {count} lens" |
* | "other" | "Used in {count} lenses" |
*
* @param {Options_Reachused1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_reachused1 = /** @type {((inputs: Options_Reachused1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Reachused1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_reachused1(inputs)
	if (locale === "es") return __es.options_reachused1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_reachused1(inputs)
	if (locale === "fr") return __fr.options_reachused1(inputs)
	if (locale === "de") return __de.options_reachused1(inputs)
	if (locale === "ja") return __ja.options_reachused1(inputs)
	if (locale === "ko") return __ko.options_reachused1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_reachused1(inputs)
	return __ru.options_reachused1(inputs)
});
export { options_reachused1 as "options_reachUsed" }
/**
* | output |
* | --- |
* | "Personal token" |
*
* @param {Options_Authmethodpersonaltoken3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodpersonaltoken3 = /** @type {((inputs?: Options_Authmethodpersonaltoken3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodpersonaltoken3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_authmethodpersonaltoken3(inputs)
	if (locale === "es") return __es.options_authmethodpersonaltoken3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_authmethodpersonaltoken3(inputs)
	if (locale === "fr") return __fr.options_authmethodpersonaltoken3(inputs)
	if (locale === "de") return __de.options_authmethodpersonaltoken3(inputs)
	if (locale === "ja") return __ja.options_authmethodpersonaltoken3(inputs)
	if (locale === "ko") return __ko.options_authmethodpersonaltoken3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_authmethodpersonaltoken3(inputs)
	return __ru.options_authmethodpersonaltoken3(inputs)
});
export { options_authmethodpersonaltoken3 as "options_authMethodPersonalToken" }
/**
* | output |
* | --- |
* | "Browser session" |
*
* @param {Options_Authmethodbrowsersession3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodbrowsersession3 = /** @type {((inputs?: Options_Authmethodbrowsersession3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodbrowsersession3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_authmethodbrowsersession3(inputs)
	if (locale === "es") return __es.options_authmethodbrowsersession3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_authmethodbrowsersession3(inputs)
	if (locale === "fr") return __fr.options_authmethodbrowsersession3(inputs)
	if (locale === "de") return __de.options_authmethodbrowsersession3(inputs)
	if (locale === "ja") return __ja.options_authmethodbrowsersession3(inputs)
	if (locale === "ko") return __ko.options_authmethodbrowsersession3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_authmethodbrowsersession3(inputs)
	return __ru.options_authmethodbrowsersession3(inputs)
});
export { options_authmethodbrowsersession3 as "options_authMethodBrowserSession" }
/**
* | output |
* | --- |
* | "Token needed" |
*
* @param {Options_Authmethodtokenneeded3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodtokenneeded3 = /** @type {((inputs?: Options_Authmethodtokenneeded3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodtokenneeded3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_authmethodtokenneeded3(inputs)
	if (locale === "es") return __es.options_authmethodtokenneeded3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_authmethodtokenneeded3(inputs)
	if (locale === "fr") return __fr.options_authmethodtokenneeded3(inputs)
	if (locale === "de") return __de.options_authmethodtokenneeded3(inputs)
	if (locale === "ja") return __ja.options_authmethodtokenneeded3(inputs)
	if (locale === "ko") return __ko.options_authmethodtokenneeded3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_authmethodtokenneeded3(inputs)
	return __ru.options_authmethodtokenneeded3(inputs)
});
export { options_authmethodtokenneeded3 as "options_authMethodTokenNeeded" }
/**
* | output |
* | --- |
* | "Sign-in needed" |
*
* @param {Options_Authmethodsigninneeded4Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodsigninneeded4 = /** @type {((inputs?: Options_Authmethodsigninneeded4Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodsigninneeded4Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_authmethodsigninneeded4(inputs)
	if (locale === "es") return __es.options_authmethodsigninneeded4(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_authmethodsigninneeded4(inputs)
	if (locale === "fr") return __fr.options_authmethodsigninneeded4(inputs)
	if (locale === "de") return __de.options_authmethodsigninneeded4(inputs)
	if (locale === "ja") return __ja.options_authmethodsigninneeded4(inputs)
	if (locale === "ko") return __ko.options_authmethodsigninneeded4(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_authmethodsigninneeded4(inputs)
	return __ru.options_authmethodsigninneeded4(inputs)
});
export { options_authmethodsigninneeded4 as "options_authMethodSignInNeeded" }
/**
* | output |
* | --- |
* | "Public" |
*
* @param {Options_Authmethodpublic2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_authmethodpublic2 = /** @type {((inputs?: Options_Authmethodpublic2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Authmethodpublic2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_authmethodpublic2(inputs)
	if (locale === "es") return __es.options_authmethodpublic2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_authmethodpublic2(inputs)
	if (locale === "fr") return __fr.options_authmethodpublic2(inputs)
	if (locale === "de") return __de.options_authmethodpublic2(inputs)
	if (locale === "ja") return __ja.options_authmethodpublic2(inputs)
	if (locale === "ko") return __ko.options_authmethodpublic2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_authmethodpublic2(inputs)
	return __ru.options_authmethodpublic2(inputs)
});
export { options_authmethodpublic2 as "options_authMethodPublic" }
/**
* | output |
* | --- |
* | "Result sources" |
*
* @param {Options_Resultsourcesheading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_resultsourcesheading2 = /** @type {((inputs?: Options_Resultsourcesheading2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Resultsourcesheading2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_resultsourcesheading2(inputs)
	if (locale === "es") return __es.options_resultsourcesheading2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_resultsourcesheading2(inputs)
	if (locale === "fr") return __fr.options_resultsourcesheading2(inputs)
	if (locale === "de") return __de.options_resultsourcesheading2(inputs)
	if (locale === "ja") return __ja.options_resultsourcesheading2(inputs)
	if (locale === "ko") return __ko.options_resultsourcesheading2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_resultsourcesheading2(inputs)
	return __ru.options_resultsourcesheading2(inputs)
});
export { options_resultsourcesheading2 as "options_resultSourcesHeading" }
/**
* | output |
* | --- |
* | "Let the launcher also search your browser history and bookmarks. Each is granted in your browser, only when you turn it on." |
*
* @param {Options_Resultsourcesdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_resultsourcesdescription2 = /** @type {((inputs?: Options_Resultsourcesdescription2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Resultsourcesdescription2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_resultsourcesdescription2(inputs)
	if (locale === "es") return __es.options_resultsourcesdescription2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_resultsourcesdescription2(inputs)
	if (locale === "fr") return __fr.options_resultsourcesdescription2(inputs)
	if (locale === "de") return __de.options_resultsourcesdescription2(inputs)
	if (locale === "ja") return __ja.options_resultsourcesdescription2(inputs)
	if (locale === "ko") return __ko.options_resultsourcesdescription2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_resultsourcesdescription2(inputs)
	return __ru.options_resultsourcesdescription2(inputs)
});
export { options_resultsourcesdescription2 as "options_resultSourcesDescription" }
/**
* | output |
* | --- |
* | "The launcher can also surface your browsing history and bookmarks. These are optional — enable each when you want it, and revoke access anytime from your bro..." |
*
* @param {Options_Resultsourcesintro2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_resultsourcesintro2 = /** @type {((inputs?: Options_Resultsourcesintro2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Resultsourcesintro2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_resultsourcesintro2(inputs)
	if (locale === "es") return __es.options_resultsourcesintro2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_resultsourcesintro2(inputs)
	if (locale === "fr") return __fr.options_resultsourcesintro2(inputs)
	if (locale === "de") return __de.options_resultsourcesintro2(inputs)
	if (locale === "ja") return __ja.options_resultsourcesintro2(inputs)
	if (locale === "ko") return __ko.options_resultsourcesintro2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_resultsourcesintro2(inputs)
	return __ru.options_resultsourcesintro2(inputs)
});
export { options_resultsourcesintro2 as "options_resultSourcesIntro" }
/**
* | output |
* | --- |
* | "Browsing history" |
*
* @param {Options_Historylabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_historylabel1 = /** @type {((inputs?: Options_Historylabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Historylabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_historylabel1(inputs)
	if (locale === "es") return __es.options_historylabel1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_historylabel1(inputs)
	if (locale === "fr") return __fr.options_historylabel1(inputs)
	if (locale === "de") return __de.options_historylabel1(inputs)
	if (locale === "ja") return __ja.options_historylabel1(inputs)
	if (locale === "ko") return __ko.options_historylabel1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_historylabel1(inputs)
	return __ru.options_historylabel1(inputs)
});
export { options_historylabel1 as "options_historyLabel" }
/**
* | output |
* | --- |
* | "Show matching pages from your browsing history in the launcher." |
*
* @param {Options_Historydescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_historydescription1 = /** @type {((inputs?: Options_Historydescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Historydescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_historydescription1(inputs)
	if (locale === "es") return __es.options_historydescription1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_historydescription1(inputs)
	if (locale === "fr") return __fr.options_historydescription1(inputs)
	if (locale === "de") return __de.options_historydescription1(inputs)
	if (locale === "ja") return __ja.options_historydescription1(inputs)
	if (locale === "ko") return __ko.options_historydescription1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_historydescription1(inputs)
	return __ru.options_historydescription1(inputs)
});
export { options_historydescription1 as "options_historyDescription" }
/**
* | output |
* | --- |
* | "Enable history results" |
*
* @param {Options_Enablehistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_enablehistory1 = /** @type {((inputs?: Options_Enablehistory1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Enablehistory1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_enablehistory1(inputs)
	if (locale === "es") return __es.options_enablehistory1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_enablehistory1(inputs)
	if (locale === "fr") return __fr.options_enablehistory1(inputs)
	if (locale === "de") return __de.options_enablehistory1(inputs)
	if (locale === "ja") return __ja.options_enablehistory1(inputs)
	if (locale === "ko") return __ko.options_enablehistory1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_enablehistory1(inputs)
	return __ru.options_enablehistory1(inputs)
});
export { options_enablehistory1 as "options_enableHistory" }
/**
* | output |
* | --- |
* | "Bookmarks" |
*
* @param {Options_Bookmarkslabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_bookmarkslabel1 = /** @type {((inputs?: Options_Bookmarkslabel1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Bookmarkslabel1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_bookmarkslabel1(inputs)
	if (locale === "es") return __es.options_bookmarkslabel1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_bookmarkslabel1(inputs)
	if (locale === "fr") return __fr.options_bookmarkslabel1(inputs)
	if (locale === "de") return __de.options_bookmarkslabel1(inputs)
	if (locale === "ja") return __ja.options_bookmarkslabel1(inputs)
	if (locale === "ko") return __ko.options_bookmarkslabel1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_bookmarkslabel1(inputs)
	return __ru.options_bookmarkslabel1(inputs)
});
export { options_bookmarkslabel1 as "options_bookmarksLabel" }
/**
* | output |
* | --- |
* | "Show matching bookmarks in the launcher." |
*
* @param {Options_Bookmarksdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_bookmarksdescription1 = /** @type {((inputs?: Options_Bookmarksdescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Bookmarksdescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_bookmarksdescription1(inputs)
	if (locale === "es") return __es.options_bookmarksdescription1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_bookmarksdescription1(inputs)
	if (locale === "fr") return __fr.options_bookmarksdescription1(inputs)
	if (locale === "de") return __de.options_bookmarksdescription1(inputs)
	if (locale === "ja") return __ja.options_bookmarksdescription1(inputs)
	if (locale === "ko") return __ko.options_bookmarksdescription1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_bookmarksdescription1(inputs)
	return __ru.options_bookmarksdescription1(inputs)
});
export { options_bookmarksdescription1 as "options_bookmarksDescription" }
/**
* | output |
* | --- |
* | "Enable bookmark results" |
*
* @param {Options_Enablebookmarks1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_enablebookmarks1 = /** @type {((inputs?: Options_Enablebookmarks1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Enablebookmarks1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_enablebookmarks1(inputs)
	if (locale === "es") return __es.options_enablebookmarks1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_enablebookmarks1(inputs)
	if (locale === "fr") return __fr.options_enablebookmarks1(inputs)
	if (locale === "de") return __de.options_enablebookmarks1(inputs)
	if (locale === "ja") return __ja.options_enablebookmarks1(inputs)
	if (locale === "ko") return __ko.options_enablebookmarks1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_enablebookmarks1(inputs)
	return __ru.options_enablebookmarks1(inputs)
});
export { options_enablebookmarks1 as "options_enableBookmarks" }
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Options_Sourceenabled1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_sourceenabled1 = /** @type {((inputs?: Options_Sourceenabled1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Sourceenabled1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_sourceenabled1(inputs)
	if (locale === "es") return __es.options_sourceenabled1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_sourceenabled1(inputs)
	if (locale === "fr") return __fr.options_sourceenabled1(inputs)
	if (locale === "de") return __de.options_sourceenabled1(inputs)
	if (locale === "ja") return __ja.options_sourceenabled1(inputs)
	if (locale === "ko") return __ko.options_sourceenabled1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_sourceenabled1(inputs)
	return __ru.options_sourceenabled1(inputs)
});
export { options_sourceenabled1 as "options_sourceEnabled" }
/**
* | output |
* | --- |
* | "{label} enabled" |
*
* @param {Options_Sourceenabledtoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_sourceenabledtoast2 = /** @type {((inputs: Options_Sourceenabledtoast2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Sourceenabledtoast2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_sourceenabledtoast2(inputs)
	if (locale === "es") return __es.options_sourceenabledtoast2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_sourceenabledtoast2(inputs)
	if (locale === "fr") return __fr.options_sourceenabledtoast2(inputs)
	if (locale === "de") return __de.options_sourceenabledtoast2(inputs)
	if (locale === "ja") return __ja.options_sourceenabledtoast2(inputs)
	if (locale === "ko") return __ko.options_sourceenabledtoast2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_sourceenabledtoast2(inputs)
	return __ru.options_sourceenabledtoast2(inputs)
});
export { options_sourceenabledtoast2 as "options_sourceEnabledToast" }
/**
* | output |
* | --- |
* | "Recently archived" |
*
* @param {Options_Recentlyarchivedheading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_recentlyarchivedheading2 = /** @type {((inputs?: Options_Recentlyarchivedheading2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Recentlyarchivedheading2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_recentlyarchivedheading2(inputs)
	if (locale === "es") return __es.options_recentlyarchivedheading2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_recentlyarchivedheading2(inputs)
	if (locale === "fr") return __fr.options_recentlyarchivedheading2(inputs)
	if (locale === "de") return __de.options_recentlyarchivedheading2(inputs)
	if (locale === "ja") return __ja.options_recentlyarchivedheading2(inputs)
	if (locale === "ko") return __ko.options_recentlyarchivedheading2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_recentlyarchivedheading2(inputs)
	return __ru.options_recentlyarchivedheading2(inputs)
});
export { options_recentlyarchivedheading2 as "options_recentlyArchivedHeading" }
/**
* | output |
* | --- |
* | "Tabs archived automatically land here — reopen one, or let it expire on the schedule above." |
*
* @param {Options_Recentlyarchiveddescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_recentlyarchiveddescription2 = /** @type {((inputs?: Options_Recentlyarchiveddescription2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Recentlyarchiveddescription2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_recentlyarchiveddescription2(inputs)
	if (locale === "es") return __es.options_recentlyarchiveddescription2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_recentlyarchiveddescription2(inputs)
	if (locale === "fr") return __fr.options_recentlyarchiveddescription2(inputs)
	if (locale === "de") return __de.options_recentlyarchiveddescription2(inputs)
	if (locale === "ja") return __ja.options_recentlyarchiveddescription2(inputs)
	if (locale === "ko") return __ko.options_recentlyarchiveddescription2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_recentlyarchiveddescription2(inputs)
	return __ru.options_recentlyarchiveddescription2(inputs)
});
export { options_recentlyarchiveddescription2 as "options_recentlyArchivedDescription" }
/**
* | output |
* | --- |
* | "Delete all archived records? This cannot be undone." |
*
* @param {Options_Cleararchivedconfirm2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_cleararchivedconfirm2 = /** @type {((inputs?: Options_Cleararchivedconfirm2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Cleararchivedconfirm2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_cleararchivedconfirm2(inputs)
	if (locale === "es") return __es.options_cleararchivedconfirm2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_cleararchivedconfirm2(inputs)
	if (locale === "fr") return __fr.options_cleararchivedconfirm2(inputs)
	if (locale === "de") return __de.options_cleararchivedconfirm2(inputs)
	if (locale === "ja") return __ja.options_cleararchivedconfirm2(inputs)
	if (locale === "ko") return __ko.options_cleararchivedconfirm2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_cleararchivedconfirm2(inputs)
	return __ru.options_cleararchivedconfirm2(inputs)
});
export { options_cleararchivedconfirm2 as "options_clearArchivedConfirm" }
/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Options_Cleararchivedcancel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_cleararchivedcancel2 = /** @type {((inputs?: Options_Cleararchivedcancel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Cleararchivedcancel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_cleararchivedcancel2(inputs)
	if (locale === "es") return __es.options_cleararchivedcancel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_cleararchivedcancel2(inputs)
	if (locale === "fr") return __fr.options_cleararchivedcancel2(inputs)
	if (locale === "de") return __de.options_cleararchivedcancel2(inputs)
	if (locale === "ja") return __ja.options_cleararchivedcancel2(inputs)
	if (locale === "ko") return __ko.options_cleararchivedcancel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_cleararchivedcancel2(inputs)
	return __ru.options_cleararchivedcancel2(inputs)
});
export { options_cleararchivedcancel2 as "options_clearArchivedCancel" }
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Options_Cleararchiveddelete2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_cleararchiveddelete2 = /** @type {((inputs?: Options_Cleararchiveddelete2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Cleararchiveddelete2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_cleararchiveddelete2(inputs)
	if (locale === "es") return __es.options_cleararchiveddelete2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_cleararchiveddelete2(inputs)
	if (locale === "fr") return __fr.options_cleararchiveddelete2(inputs)
	if (locale === "de") return __de.options_cleararchiveddelete2(inputs)
	if (locale === "ja") return __ja.options_cleararchiveddelete2(inputs)
	if (locale === "ko") return __ko.options_cleararchiveddelete2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_cleararchiveddelete2(inputs)
	return __ru.options_cleararchiveddelete2(inputs)
});
export { options_cleararchiveddelete2 as "options_clearArchivedDelete" }
/**
* | output |
* | --- |
* | "Clear all" |
*
* @param {Options_Cleararchived1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_cleararchived1 = /** @type {((inputs?: Options_Cleararchived1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Cleararchived1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_cleararchived1(inputs)
	if (locale === "es") return __es.options_cleararchived1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_cleararchived1(inputs)
	if (locale === "fr") return __fr.options_cleararchived1(inputs)
	if (locale === "de") return __de.options_cleararchived1(inputs)
	if (locale === "ja") return __ja.options_cleararchived1(inputs)
	if (locale === "ko") return __ko.options_cleararchived1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_cleararchived1(inputs)
	return __ru.options_cleararchived1(inputs)
});
export { options_cleararchived1 as "options_clearArchived" }
/**
* | output |
* | --- |
* | "Nothing archived yet — idle temporary tabs land here so you can bring them back." |
*
* @param {Options_Archivedempty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_archivedempty1 = /** @type {((inputs?: Options_Archivedempty1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Archivedempty1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_archivedempty1(inputs)
	if (locale === "es") return __es.options_archivedempty1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_archivedempty1(inputs)
	if (locale === "fr") return __fr.options_archivedempty1(inputs)
	if (locale === "de") return __de.options_archivedempty1(inputs)
	if (locale === "ja") return __ja.options_archivedempty1(inputs)
	if (locale === "ko") return __ko.options_archivedempty1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_archivedempty1(inputs)
	return __ru.options_archivedempty1(inputs)
});
export { options_archivedempty1 as "options_archivedEmpty" }
/**
* | output |
* | --- |
* | "Restore {title}" |
*
* @param {Options_Restorearchivedlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_restorearchivedlabel2 = /** @type {((inputs: Options_Restorearchivedlabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Restorearchivedlabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_restorearchivedlabel2(inputs)
	if (locale === "es") return __es.options_restorearchivedlabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_restorearchivedlabel2(inputs)
	if (locale === "fr") return __fr.options_restorearchivedlabel2(inputs)
	if (locale === "de") return __de.options_restorearchivedlabel2(inputs)
	if (locale === "ja") return __ja.options_restorearchivedlabel2(inputs)
	if (locale === "ko") return __ko.options_restorearchivedlabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_restorearchivedlabel2(inputs)
	return __ru.options_restorearchivedlabel2(inputs)
});
export { options_restorearchivedlabel2 as "options_restoreArchivedLabel" }
/**
* | output |
* | --- |
* | "Restore" |
*
* @param {Options_Restorearchivedtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_restorearchivedtitle2 = /** @type {((inputs?: Options_Restorearchivedtitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Restorearchivedtitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_restorearchivedtitle2(inputs)
	if (locale === "es") return __es.options_restorearchivedtitle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_restorearchivedtitle2(inputs)
	if (locale === "fr") return __fr.options_restorearchivedtitle2(inputs)
	if (locale === "de") return __de.options_restorearchivedtitle2(inputs)
	if (locale === "ja") return __ja.options_restorearchivedtitle2(inputs)
	if (locale === "ko") return __ko.options_restorearchivedtitle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_restorearchivedtitle2(inputs)
	return __ru.options_restorearchivedtitle2(inputs)
});
export { options_restorearchivedtitle2 as "options_restoreArchivedTitle" }
/**
* | output |
* | --- |
* | "Delete {title}" |
*
* @param {Options_Deletearchivedlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_deletearchivedlabel2 = /** @type {((inputs: Options_Deletearchivedlabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Deletearchivedlabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_deletearchivedlabel2(inputs)
	if (locale === "es") return __es.options_deletearchivedlabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_deletearchivedlabel2(inputs)
	if (locale === "fr") return __fr.options_deletearchivedlabel2(inputs)
	if (locale === "de") return __de.options_deletearchivedlabel2(inputs)
	if (locale === "ja") return __ja.options_deletearchivedlabel2(inputs)
	if (locale === "ko") return __ko.options_deletearchivedlabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_deletearchivedlabel2(inputs)
	return __ru.options_deletearchivedlabel2(inputs)
});
export { options_deletearchivedlabel2 as "options_deleteArchivedLabel" }
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Options_Deletearchivedtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_deletearchivedtitle2 = /** @type {((inputs?: Options_Deletearchivedtitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Deletearchivedtitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_deletearchivedtitle2(inputs)
	if (locale === "es") return __es.options_deletearchivedtitle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_deletearchivedtitle2(inputs)
	if (locale === "fr") return __fr.options_deletearchivedtitle2(inputs)
	if (locale === "de") return __de.options_deletearchivedtitle2(inputs)
	if (locale === "ja") return __ja.options_deletearchivedtitle2(inputs)
	if (locale === "ko") return __ko.options_deletearchivedtitle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_deletearchivedtitle2(inputs)
	return __ru.options_deletearchivedtitle2(inputs)
});
export { options_deletearchivedtitle2 as "options_deleteArchivedTitle" }
/**
* | output |
* | --- |
* | "Set the launcher shortcut" |
*
* @param {Options_Shortcuttitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_shortcuttitle1 = /** @type {((inputs?: Options_Shortcuttitle1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Shortcuttitle1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_shortcuttitle1(inputs)
	if (locale === "es") return __es.options_shortcuttitle1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_shortcuttitle1(inputs)
	if (locale === "fr") return __fr.options_shortcuttitle1(inputs)
	if (locale === "de") return __de.options_shortcuttitle1(inputs)
	if (locale === "ja") return __ja.options_shortcuttitle1(inputs)
	if (locale === "ko") return __ko.options_shortcuttitle1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_shortcuttitle1(inputs)
	return __ru.options_shortcuttitle1(inputs)
});
export { options_shortcuttitle1 as "options_shortcutTitle" }
/**
* | output |
* | --- |
* | "{modifier}L isn't currently bound. Your browser has to set the keyboard shortcut — open its shortcuts page to bind it." |
*
* @param {Options_Shortcutdescription1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_shortcutdescription1 = /** @type {((inputs: Options_Shortcutdescription1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Shortcutdescription1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_shortcutdescription1(inputs)
	if (locale === "es") return __es.options_shortcutdescription1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_shortcutdescription1(inputs)
	if (locale === "fr") return __fr.options_shortcutdescription1(inputs)
	if (locale === "de") return __de.options_shortcutdescription1(inputs)
	if (locale === "ja") return __ja.options_shortcutdescription1(inputs)
	if (locale === "ko") return __ko.options_shortcutdescription1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_shortcutdescription1(inputs)
	return __ru.options_shortcutdescription1(inputs)
});
export { options_shortcutdescription1 as "options_shortcutDescription" }
/**
* | output |
* | --- |
* | "Open keyboard shortcuts" |
*
* @param {Options_Openshortcuts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_openshortcuts1 = /** @type {((inputs?: Options_Openshortcuts1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Openshortcuts1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_openshortcuts1(inputs)
	if (locale === "es") return __es.options_openshortcuts1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_openshortcuts1(inputs)
	if (locale === "fr") return __fr.options_openshortcuts1(inputs)
	if (locale === "de") return __de.options_openshortcuts1(inputs)
	if (locale === "ja") return __ja.options_openshortcuts1(inputs)
	if (locale === "ko") return __ko.options_openshortcuts1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_openshortcuts1(inputs)
	return __ru.options_openshortcuts1(inputs)
});
export { options_openshortcuts1 as "options_openShortcuts" }
/**
* | output |
* | --- |
* | "Search & launcher" |
*
* @param {Options_Grouplabel_Search1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_grouplabel_search1 = /** @type {((inputs?: Options_Grouplabel_Search1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Grouplabel_Search1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_grouplabel_search1(inputs)
	if (locale === "es") return __es.options_grouplabel_search1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_grouplabel_search1(inputs)
	if (locale === "fr") return __fr.options_grouplabel_search1(inputs)
	if (locale === "de") return __de.options_grouplabel_search1(inputs)
	if (locale === "ja") return __ja.options_grouplabel_search1(inputs)
	if (locale === "ko") return __ko.options_grouplabel_search1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_grouplabel_search1(inputs)
	return __ru.options_grouplabel_search1(inputs)
});
export { options_grouplabel_search1 as "options_groupLabel_search" }
/**
* | output |
* | --- |
* | "Appearance" |
*
* @param {Options_Grouplabel_Appearance1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_grouplabel_appearance1 = /** @type {((inputs?: Options_Grouplabel_Appearance1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Grouplabel_Appearance1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_grouplabel_appearance1(inputs)
	if (locale === "es") return __es.options_grouplabel_appearance1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_grouplabel_appearance1(inputs)
	if (locale === "fr") return __fr.options_grouplabel_appearance1(inputs)
	if (locale === "de") return __de.options_grouplabel_appearance1(inputs)
	if (locale === "ja") return __ja.options_grouplabel_appearance1(inputs)
	if (locale === "ko") return __ko.options_grouplabel_appearance1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_grouplabel_appearance1(inputs)
	return __ru.options_grouplabel_appearance1(inputs)
});
export { options_grouplabel_appearance1 as "options_groupLabel_appearance" }
/**
* | output |
* | --- |
* | "Tabs" |
*
* @param {Options_Grouplabel_Tabs1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_grouplabel_tabs1 = /** @type {((inputs?: Options_Grouplabel_Tabs1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Grouplabel_Tabs1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_grouplabel_tabs1(inputs)
	if (locale === "es") return __es.options_grouplabel_tabs1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_grouplabel_tabs1(inputs)
	if (locale === "fr") return __fr.options_grouplabel_tabs1(inputs)
	if (locale === "de") return __de.options_grouplabel_tabs1(inputs)
	if (locale === "ja") return __ja.options_grouplabel_tabs1(inputs)
	if (locale === "ko") return __ko.options_grouplabel_tabs1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_grouplabel_tabs1(inputs)
	return __ru.options_grouplabel_tabs1(inputs)
});
export { options_grouplabel_tabs1 as "options_groupLabel_tabs" }
/**
* | output |
* | --- |
* | "Auto-archive" |
*
* @param {Options_Grouplabel_Autoarchive2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_grouplabel_autoarchive2 = /** @type {((inputs?: Options_Grouplabel_Autoarchive2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Grouplabel_Autoarchive2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_grouplabel_autoarchive2(inputs)
	if (locale === "es") return __es.options_grouplabel_autoarchive2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_grouplabel_autoarchive2(inputs)
	if (locale === "fr") return __fr.options_grouplabel_autoarchive2(inputs)
	if (locale === "de") return __de.options_grouplabel_autoarchive2(inputs)
	if (locale === "ja") return __ja.options_grouplabel_autoarchive2(inputs)
	if (locale === "ko") return __ko.options_grouplabel_autoarchive2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_grouplabel_autoarchive2(inputs)
	return __ru.options_grouplabel_autoarchive2(inputs)
});
export { options_grouplabel_autoarchive2 as "options_groupLabel_autoArchive" }
/**
* | output |
* | --- |
* | "Language" |
*
* @param {Options_Label_LanguageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_language = /** @type {((inputs?: Options_Label_LanguageInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_LanguageInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_language(inputs)
	if (locale === "es") return __es.options_label_language(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_language(inputs)
	if (locale === "fr") return __fr.options_label_language(inputs)
	if (locale === "de") return __de.options_label_language(inputs)
	if (locale === "ja") return __ja.options_label_language(inputs)
	if (locale === "ko") return __ko.options_label_language(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_language(inputs)
	return __ru.options_label_language(inputs)
});
/**
* | output |
* | --- |
* | "Which language Lunma's interface uses — System follows your browser." |
*
* @param {Options_Desc_LanguageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_language = /** @type {((inputs?: Options_Desc_LanguageInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_LanguageInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_language(inputs)
	if (locale === "es") return __es.options_desc_language(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_language(inputs)
	if (locale === "fr") return __fr.options_desc_language(inputs)
	if (locale === "de") return __de.options_desc_language(inputs)
	if (locale === "ja") return __ja.options_desc_language(inputs)
	if (locale === "ko") return __ko.options_desc_language(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_language(inputs)
	return __ru.options_desc_language(inputs)
});
/**
* | output |
* | --- |
* | "Default search engine" |
*
* @param {Options_Label_Defaultsearchengine2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_defaultsearchengine2 = /** @type {((inputs?: Options_Label_Defaultsearchengine2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Defaultsearchengine2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_defaultsearchengine2(inputs)
	if (locale === "es") return __es.options_label_defaultsearchengine2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_defaultsearchengine2(inputs)
	if (locale === "fr") return __fr.options_label_defaultsearchengine2(inputs)
	if (locale === "de") return __de.options_label_defaultsearchengine2(inputs)
	if (locale === "ja") return __ja.options_label_defaultsearchengine2(inputs)
	if (locale === "ko") return __ko.options_label_defaultsearchengine2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_defaultsearchengine2(inputs)
	return __ru.options_label_defaultsearchengine2(inputs)
});
export { options_label_defaultsearchengine2 as "options_label_defaultSearchEngine" }
/**
* | output |
* | --- |
* | "Which engine the launcher searches a query with" |
*
* @param {Options_Desc_Defaultsearchengine2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_defaultsearchengine2 = /** @type {((inputs?: Options_Desc_Defaultsearchengine2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Defaultsearchengine2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_defaultsearchengine2(inputs)
	if (locale === "es") return __es.options_desc_defaultsearchengine2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_defaultsearchengine2(inputs)
	if (locale === "fr") return __fr.options_desc_defaultsearchengine2(inputs)
	if (locale === "de") return __de.options_desc_defaultsearchengine2(inputs)
	if (locale === "ja") return __ja.options_desc_defaultsearchengine2(inputs)
	if (locale === "ko") return __ko.options_desc_defaultsearchengine2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_defaultsearchengine2(inputs)
	return __ru.options_desc_defaultsearchengine2(inputs)
});
export { options_desc_defaultsearchengine2 as "options_desc_defaultSearchEngine" }
/**
* | output |
* | --- |
* | "Custom search URL" |
*
* @param {Options_Label_Customsearchurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_customsearchurl2 = /** @type {((inputs?: Options_Label_Customsearchurl2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Customsearchurl2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_customsearchurl2(inputs)
	if (locale === "es") return __es.options_label_customsearchurl2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_customsearchurl2(inputs)
	if (locale === "fr") return __fr.options_label_customsearchurl2(inputs)
	if (locale === "de") return __de.options_label_customsearchurl2(inputs)
	if (locale === "ja") return __ja.options_label_customsearchurl2(inputs)
	if (locale === "ko") return __ko.options_label_customsearchurl2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_customsearchurl2(inputs)
	return __ru.options_label_customsearchurl2(inputs)
});
export { options_label_customsearchurl2 as "options_label_customSearchUrl" }
/**
* | output |
* | --- |
* | "Used when the engine above is set to Custom — %s is the query" |
*
* @param {Options_Desc_Customsearchurl2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_customsearchurl2 = /** @type {((inputs?: Options_Desc_Customsearchurl2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Customsearchurl2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_customsearchurl2(inputs)
	if (locale === "es") return __es.options_desc_customsearchurl2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_customsearchurl2(inputs)
	if (locale === "fr") return __fr.options_desc_customsearchurl2(inputs)
	if (locale === "de") return __de.options_desc_customsearchurl2(inputs)
	if (locale === "ja") return __ja.options_desc_customsearchurl2(inputs)
	if (locale === "ko") return __ko.options_desc_customsearchurl2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_customsearchurl2(inputs)
	return __ru.options_desc_customsearchurl2(inputs)
});
export { options_desc_customsearchurl2 as "options_desc_customSearchUrl" }
/**
* | output |
* | --- |
* | "Custom search keyword" |
*
* @param {Options_Label_Customsearchkeyword2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_customsearchkeyword2 = /** @type {((inputs?: Options_Label_Customsearchkeyword2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Customsearchkeyword2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_customsearchkeyword2(inputs)
	if (locale === "es") return __es.options_label_customsearchkeyword2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_customsearchkeyword2(inputs)
	if (locale === "fr") return __fr.options_label_customsearchkeyword2(inputs)
	if (locale === "de") return __de.options_label_customsearchkeyword2(inputs)
	if (locale === "ja") return __ja.options_label_customsearchkeyword2(inputs)
	if (locale === "ko") return __ko.options_label_customsearchkeyword2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_customsearchkeyword2(inputs)
	return __ru.options_label_customsearchkeyword2(inputs)
});
export { options_label_customsearchkeyword2 as "options_label_customSearchKeyword" }
/**
* | output |
* | --- |
* | "Type this + Tab in the launcher to search your custom engine" |
*
* @param {Options_Desc_Customsearchkeyword2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_customsearchkeyword2 = /** @type {((inputs?: Options_Desc_Customsearchkeyword2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Customsearchkeyword2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_customsearchkeyword2(inputs)
	if (locale === "es") return __es.options_desc_customsearchkeyword2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_customsearchkeyword2(inputs)
	if (locale === "fr") return __fr.options_desc_customsearchkeyword2(inputs)
	if (locale === "de") return __de.options_desc_customsearchkeyword2(inputs)
	if (locale === "ja") return __ja.options_desc_customsearchkeyword2(inputs)
	if (locale === "ko") return __ko.options_desc_customsearchkeyword2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_customsearchkeyword2(inputs)
	return __ru.options_desc_customsearchkeyword2(inputs)
});
export { options_desc_customsearchkeyword2 as "options_desc_customSearchKeyword" }
/**
* | output |
* | --- |
* | "Launcher scope" |
*
* @param {Options_Label_Launcherscope1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_launcherscope1 = /** @type {((inputs?: Options_Label_Launcherscope1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Launcherscope1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_launcherscope1(inputs)
	if (locale === "es") return __es.options_label_launcherscope1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_launcherscope1(inputs)
	if (locale === "fr") return __fr.options_label_launcherscope1(inputs)
	if (locale === "de") return __de.options_label_launcherscope1(inputs)
	if (locale === "ja") return __ja.options_label_launcherscope1(inputs)
	if (locale === "ko") return __ko.options_label_launcherscope1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_launcherscope1(inputs)
	return __ru.options_label_launcherscope1(inputs)
});
export { options_label_launcherscope1 as "options_label_launcherScope" }
/**
* | output |
* | --- |
* | "How the launcher ranks items that live in other Spaces" |
*
* @param {Options_Desc_Launcherscope1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_launcherscope1 = /** @type {((inputs?: Options_Desc_Launcherscope1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Launcherscope1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_launcherscope1(inputs)
	if (locale === "es") return __es.options_desc_launcherscope1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_launcherscope1(inputs)
	if (locale === "fr") return __fr.options_desc_launcherscope1(inputs)
	if (locale === "de") return __de.options_desc_launcherscope1(inputs)
	if (locale === "ja") return __ja.options_desc_launcherscope1(inputs)
	if (locale === "ko") return __ko.options_desc_launcherscope1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_launcherscope1(inputs)
	return __ru.options_desc_launcherscope1(inputs)
});
export { options_desc_launcherscope1 as "options_desc_launcherScope" }
/**
* | output |
* | --- |
* | "Density" |
*
* @param {Options_Label_DensityInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_density = /** @type {((inputs?: Options_Label_DensityInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_DensityInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_density(inputs)
	if (locale === "es") return __es.options_label_density(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_density(inputs)
	if (locale === "fr") return __fr.options_label_density(inputs)
	if (locale === "de") return __de.options_label_density(inputs)
	if (locale === "ja") return __ja.options_label_density(inputs)
	if (locale === "ko") return __ko.options_label_density(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_density(inputs)
	return __ru.options_label_density(inputs)
});
/**
* | output |
* | --- |
* | "How much space rows use — across tabs and launcher results" |
*
* @param {Options_Desc_DensityInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_density = /** @type {((inputs?: Options_Desc_DensityInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_DensityInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_density(inputs)
	if (locale === "es") return __es.options_desc_density(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_density(inputs)
	if (locale === "fr") return __fr.options_desc_density(inputs)
	if (locale === "de") return __de.options_desc_density(inputs)
	if (locale === "ja") return __ja.options_desc_density(inputs)
	if (locale === "ko") return __ko.options_desc_density(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_density(inputs)
	return __ru.options_desc_density(inputs)
});
/**
* | output |
* | --- |
* | "Colour intensity" |
*
* @param {Options_Label_TintInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_tint = /** @type {((inputs?: Options_Label_TintInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_TintInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_tint(inputs)
	if (locale === "es") return __es.options_label_tint(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_tint(inputs)
	if (locale === "fr") return __fr.options_label_tint(inputs)
	if (locale === "de") return __de.options_label_tint(inputs)
	if (locale === "ja") return __ja.options_label_tint(inputs)
	if (locale === "ko") return __ko.options_label_tint(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_tint(inputs)
	return __ru.options_label_tint(inputs)
});
/**
* | output |
* | --- |
* | "How much the active Space's colour fills the workspace" |
*
* @param {Options_Desc_TintInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_tint = /** @type {((inputs?: Options_Desc_TintInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_TintInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_tint(inputs)
	if (locale === "es") return __es.options_desc_tint(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_tint(inputs)
	if (locale === "fr") return __fr.options_desc_tint(inputs)
	if (locale === "de") return __de.options_desc_tint(inputs)
	if (locale === "ja") return __ja.options_desc_tint(inputs)
	if (locale === "ko") return __ko.options_desc_tint(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_tint(inputs)
	return __ru.options_desc_tint(inputs)
});
/**
* | output |
* | --- |
* | "Theme" |
*
* @param {Options_Label_ThemeInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_label_theme = /** @type {((inputs?: Options_Label_ThemeInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_ThemeInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_theme(inputs)
	if (locale === "es") return __es.options_label_theme(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_theme(inputs)
	if (locale === "fr") return __fr.options_label_theme(inputs)
	if (locale === "de") return __de.options_label_theme(inputs)
	if (locale === "ja") return __ja.options_label_theme(inputs)
	if (locale === "ko") return __ko.options_label_theme(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_theme(inputs)
	return __ru.options_label_theme(inputs)
});
/**
* | output |
* | --- |
* | "Deep warm night, or frosted daylight." |
*
* @param {Options_Desc_ThemeInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_desc_theme = /** @type {((inputs?: Options_Desc_ThemeInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_ThemeInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_theme(inputs)
	if (locale === "es") return __es.options_desc_theme(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_theme(inputs)
	if (locale === "fr") return __fr.options_desc_theme(inputs)
	if (locale === "de") return __de.options_desc_theme(inputs)
	if (locale === "ja") return __ja.options_desc_theme(inputs)
	if (locale === "ko") return __ko.options_desc_theme(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_theme(inputs)
	return __ru.options_desc_theme(inputs)
});
/**
* | output |
* | --- |
* | "Atmosphere glow" |
*
* @param {Options_Label_Showglares1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_showglares1 = /** @type {((inputs?: Options_Label_Showglares1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Showglares1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_showglares1(inputs)
	if (locale === "es") return __es.options_label_showglares1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_showglares1(inputs)
	if (locale === "fr") return __fr.options_label_showglares1(inputs)
	if (locale === "de") return __de.options_label_showglares1(inputs)
	if (locale === "ja") return __ja.options_label_showglares1(inputs)
	if (locale === "ko") return __ko.options_label_showglares1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_showglares1(inputs)
	return __ru.options_label_showglares1(inputs)
});
export { options_label_showglares1 as "options_label_showGlares" }
/**
* | output |
* | --- |
* | "Soft aurora glare behind the app." |
*
* @param {Options_Desc_Showglares1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_showglares1 = /** @type {((inputs?: Options_Desc_Showglares1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Showglares1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_showglares1(inputs)
	if (locale === "es") return __es.options_desc_showglares1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_showglares1(inputs)
	if (locale === "fr") return __fr.options_desc_showglares1(inputs)
	if (locale === "de") return __de.options_desc_showglares1(inputs)
	if (locale === "ja") return __ja.options_desc_showglares1(inputs)
	if (locale === "ko") return __ko.options_desc_showglares1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_showglares1(inputs)
	return __ru.options_desc_showglares1(inputs)
});
export { options_desc_showglares1 as "options_desc_showGlares" }
/**
* | output |
* | --- |
* | "Reduce motion" |
*
* @param {Options_Label_Reducemotion1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_reducemotion1 = /** @type {((inputs?: Options_Label_Reducemotion1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Reducemotion1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_reducemotion1(inputs)
	if (locale === "es") return __es.options_label_reducemotion1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_reducemotion1(inputs)
	if (locale === "fr") return __fr.options_label_reducemotion1(inputs)
	if (locale === "de") return __de.options_label_reducemotion1(inputs)
	if (locale === "ja") return __ja.options_label_reducemotion1(inputs)
	if (locale === "ko") return __ko.options_label_reducemotion1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_reducemotion1(inputs)
	return __ru.options_label_reducemotion1(inputs)
});
export { options_label_reducemotion1 as "options_label_reduceMotion" }
/**
* | output |
* | --- |
* | "Hold the drifting glow and ease transitions." |
*
* @param {Options_Desc_Reducemotion1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_reducemotion1 = /** @type {((inputs?: Options_Desc_Reducemotion1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Reducemotion1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_reducemotion1(inputs)
	if (locale === "es") return __es.options_desc_reducemotion1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_reducemotion1(inputs)
	if (locale === "fr") return __fr.options_desc_reducemotion1(inputs)
	if (locale === "de") return __de.options_desc_reducemotion1(inputs)
	if (locale === "ja") return __ja.options_desc_reducemotion1(inputs)
	if (locale === "ko") return __ko.options_desc_reducemotion1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_reducemotion1(inputs)
	return __ru.options_desc_reducemotion1(inputs)
});
export { options_desc_reducemotion1 as "options_desc_reduceMotion" }
/**
* | output |
* | --- |
* | "Switch to an already-open tab" |
*
* @param {Options_Label_Dedupnewtabnavigations3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_dedupnewtabnavigations3 = /** @type {((inputs?: Options_Label_Dedupnewtabnavigations3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Dedupnewtabnavigations3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_dedupnewtabnavigations3(inputs)
	if (locale === "es") return __es.options_label_dedupnewtabnavigations3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_dedupnewtabnavigations3(inputs)
	if (locale === "fr") return __fr.options_label_dedupnewtabnavigations3(inputs)
	if (locale === "de") return __de.options_label_dedupnewtabnavigations3(inputs)
	if (locale === "ja") return __ja.options_label_dedupnewtabnavigations3(inputs)
	if (locale === "ko") return __ko.options_label_dedupnewtabnavigations3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_dedupnewtabnavigations3(inputs)
	return __ru.options_label_dedupnewtabnavigations3(inputs)
});
export { options_label_dedupnewtabnavigations3 as "options_label_dedupNewTabNavigations" }
/**
* | output |
* | --- |
* | "When you open a new tab and go to a page that's already open in this space, switch to it instead of opening a duplicate" |
*
* @param {Options_Desc_Dedupnewtabnavigations3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_dedupnewtabnavigations3 = /** @type {((inputs?: Options_Desc_Dedupnewtabnavigations3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Dedupnewtabnavigations3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "es") return __es.options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "fr") return __fr.options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "de") return __de.options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "ja") return __ja.options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "ko") return __ko.options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_dedupnewtabnavigations3(inputs)
	return __ru.options_desc_dedupnewtabnavigations3(inputs)
});
export { options_desc_dedupnewtabnavigations3 as "options_desc_dedupNewTabNavigations" }
/**
* | output |
* | --- |
* | "Lock pinned tabs to their site" |
*
* @param {Options_Label_Pinnedtabboundarydefault3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_pinnedtabboundarydefault3 = /** @type {((inputs?: Options_Label_Pinnedtabboundarydefault3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Pinnedtabboundarydefault3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "es") return __es.options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "fr") return __fr.options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "de") return __de.options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "ja") return __ja.options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "ko") return __ko.options_label_pinnedtabboundarydefault3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_pinnedtabboundarydefault3(inputs)
	return __ru.options_label_pinnedtabboundarydefault3(inputs)
});
export { options_label_pinnedtabboundarydefault3 as "options_label_pinnedTabBoundaryDefault" }
/**
* | output |
* | --- |
* | "Keep new pins on their own site or page; off-bounds links open in a new tab" |
*
* @param {Options_Desc_Pinnedtabboundarydefault3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_pinnedtabboundarydefault3 = /** @type {((inputs?: Options_Desc_Pinnedtabboundarydefault3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Pinnedtabboundarydefault3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "es") return __es.options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "fr") return __fr.options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "de") return __de.options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "ja") return __ja.options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "ko") return __ko.options_desc_pinnedtabboundarydefault3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_pinnedtabboundarydefault3(inputs)
	return __ru.options_desc_pinnedtabboundarydefault3(inputs)
});
export { options_desc_pinnedtabboundarydefault3 as "options_desc_pinnedTabBoundaryDefault" }
/**
* | output |
* | --- |
* | "Auto-archive idle tabs" |
*
* @param {Options_Label_Autoarchiveenabled2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_autoarchiveenabled2 = /** @type {((inputs?: Options_Label_Autoarchiveenabled2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Autoarchiveenabled2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_autoarchiveenabled2(inputs)
	if (locale === "es") return __es.options_label_autoarchiveenabled2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_autoarchiveenabled2(inputs)
	if (locale === "fr") return __fr.options_label_autoarchiveenabled2(inputs)
	if (locale === "de") return __de.options_label_autoarchiveenabled2(inputs)
	if (locale === "ja") return __ja.options_label_autoarchiveenabled2(inputs)
	if (locale === "ko") return __ko.options_label_autoarchiveenabled2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_autoarchiveenabled2(inputs)
	return __ru.options_label_autoarchiveenabled2(inputs)
});
export { options_label_autoarchiveenabled2 as "options_label_autoArchiveEnabled" }
/**
* | output |
* | --- |
* | "Quietly archive temporary tabs left idle so the workspace stays tidy" |
*
* @param {Options_Desc_Autoarchiveenabled2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_autoarchiveenabled2 = /** @type {((inputs?: Options_Desc_Autoarchiveenabled2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Autoarchiveenabled2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_autoarchiveenabled2(inputs)
	if (locale === "es") return __es.options_desc_autoarchiveenabled2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_autoarchiveenabled2(inputs)
	if (locale === "fr") return __fr.options_desc_autoarchiveenabled2(inputs)
	if (locale === "de") return __de.options_desc_autoarchiveenabled2(inputs)
	if (locale === "ja") return __ja.options_desc_autoarchiveenabled2(inputs)
	if (locale === "ko") return __ko.options_desc_autoarchiveenabled2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_autoarchiveenabled2(inputs)
	return __ru.options_desc_autoarchiveenabled2(inputs)
});
export { options_desc_autoarchiveenabled2 as "options_desc_autoArchiveEnabled" }
/**
* | output |
* | --- |
* | "Idle minutes before archiving" |
*
* @param {Options_Label_Autoarchiveidleminutes3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_autoarchiveidleminutes3 = /** @type {((inputs?: Options_Label_Autoarchiveidleminutes3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Autoarchiveidleminutes3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_autoarchiveidleminutes3(inputs)
	if (locale === "es") return __es.options_label_autoarchiveidleminutes3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_autoarchiveidleminutes3(inputs)
	if (locale === "fr") return __fr.options_label_autoarchiveidleminutes3(inputs)
	if (locale === "de") return __de.options_label_autoarchiveidleminutes3(inputs)
	if (locale === "ja") return __ja.options_label_autoarchiveidleminutes3(inputs)
	if (locale === "ko") return __ko.options_label_autoarchiveidleminutes3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_autoarchiveidleminutes3(inputs)
	return __ru.options_label_autoarchiveidleminutes3(inputs)
});
export { options_label_autoarchiveidleminutes3 as "options_label_autoArchiveIdleMinutes" }
/**
* | output |
* | --- |
* | "How long a temporary tab sits unused before it's archived (720 = 12h)" |
*
* @param {Options_Desc_Autoarchiveidleminutes3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_autoarchiveidleminutes3 = /** @type {((inputs?: Options_Desc_Autoarchiveidleminutes3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Autoarchiveidleminutes3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "es") return __es.options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "fr") return __fr.options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "de") return __de.options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "ja") return __ja.options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "ko") return __ko.options_desc_autoarchiveidleminutes3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_autoarchiveidleminutes3(inputs)
	return __ru.options_desc_autoarchiveidleminutes3(inputs)
});
export { options_desc_autoarchiveidleminutes3 as "options_desc_autoArchiveIdleMinutes" }
/**
* | output |
* | --- |
* | "Keep archived tabs for (days)" |
*
* @param {Options_Label_Autoarchiveretentiondays3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_label_autoarchiveretentiondays3 = /** @type {((inputs?: Options_Label_Autoarchiveretentiondays3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Label_Autoarchiveretentiondays3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_label_autoarchiveretentiondays3(inputs)
	if (locale === "es") return __es.options_label_autoarchiveretentiondays3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_label_autoarchiveretentiondays3(inputs)
	if (locale === "fr") return __fr.options_label_autoarchiveretentiondays3(inputs)
	if (locale === "de") return __de.options_label_autoarchiveretentiondays3(inputs)
	if (locale === "ja") return __ja.options_label_autoarchiveretentiondays3(inputs)
	if (locale === "ko") return __ko.options_label_autoarchiveretentiondays3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_label_autoarchiveretentiondays3(inputs)
	return __ru.options_label_autoarchiveretentiondays3(inputs)
});
export { options_label_autoarchiveretentiondays3 as "options_label_autoArchiveRetentionDays" }
/**
* | output |
* | --- |
* | "After this many days an archived tab is permanently deleted" |
*
* @param {Options_Desc_Autoarchiveretentiondays3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_desc_autoarchiveretentiondays3 = /** @type {((inputs?: Options_Desc_Autoarchiveretentiondays3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Desc_Autoarchiveretentiondays3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "es") return __es.options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "fr") return __fr.options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "de") return __de.options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "ja") return __ja.options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "ko") return __ko.options_desc_autoarchiveretentiondays3(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_desc_autoarchiveretentiondays3(inputs)
	return __ru.options_desc_autoarchiveretentiondays3(inputs)
});
export { options_desc_autoarchiveretentiondays3 as "options_desc_autoArchiveRetentionDays" }
/**
* | output |
* | --- |
* | "Options" |
*
* @param {Options_Pagesubtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_pagesubtitle1 = /** @type {((inputs?: Options_Pagesubtitle1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Pagesubtitle1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_pagesubtitle1(inputs)
	if (locale === "es") return __es.options_pagesubtitle1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_pagesubtitle1(inputs)
	if (locale === "fr") return __fr.options_pagesubtitle1(inputs)
	if (locale === "de") return __de.options_pagesubtitle1(inputs)
	if (locale === "ja") return __ja.options_pagesubtitle1(inputs)
	if (locale === "ko") return __ko.options_pagesubtitle1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_pagesubtitle1(inputs)
	return __ru.options_pagesubtitle1(inputs)
});
export { options_pagesubtitle1 as "options_pageSubtitle" }
/**
* | output |
* | --- |
* | "v{version}" |
*
* @param {Options_VersionInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_version = /** @type {((inputs: Options_VersionInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_VersionInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_version(inputs)
	if (locale === "es") return __es.options_version(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_version(inputs)
	if (locale === "fr") return __fr.options_version(inputs)
	if (locale === "de") return __de.options_version(inputs)
	if (locale === "ja") return __ja.options_version(inputs)
	if (locale === "ko") return __ko.options_version(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_version(inputs)
	return __ru.options_version(inputs)
});
/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Common_CancelInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_cancel = /** @type {((inputs?: Common_CancelInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_CancelInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_cancel(inputs)
	if (locale === "es") return __es.common_cancel(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_cancel(inputs)
	if (locale === "fr") return __fr.common_cancel(inputs)
	if (locale === "de") return __de.common_cancel(inputs)
	if (locale === "ja") return __ja.common_cancel(inputs)
	if (locale === "ko") return __ko.common_cancel(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_cancel(inputs)
	return __ru.common_cancel(inputs)
});
/**
* | output |
* | --- |
* | "Save" |
*
* @param {Common_SaveInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_save = /** @type {((inputs?: Common_SaveInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_SaveInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_save(inputs)
	if (locale === "es") return __es.common_save(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_save(inputs)
	if (locale === "fr") return __fr.common_save(inputs)
	if (locale === "de") return __de.common_save(inputs)
	if (locale === "ja") return __ja.common_save(inputs)
	if (locale === "ko") return __ko.common_save(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_save(inputs)
	return __ru.common_save(inputs)
});
/**
* | output |
* | --- |
* | "Add" |
*
* @param {Common_AddInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_add = /** @type {((inputs?: Common_AddInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_AddInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_add(inputs)
	if (locale === "es") return __es.common_add(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_add(inputs)
	if (locale === "fr") return __fr.common_add(inputs)
	if (locale === "de") return __de.common_add(inputs)
	if (locale === "ja") return __ja.common_add(inputs)
	if (locale === "ko") return __ko.common_add(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_add(inputs)
	return __ru.common_add(inputs)
});
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Common_DeleteInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_delete = /** @type {((inputs?: Common_DeleteInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_DeleteInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_delete(inputs)
	if (locale === "es") return __es.common_delete(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_delete(inputs)
	if (locale === "fr") return __fr.common_delete(inputs)
	if (locale === "de") return __de.common_delete(inputs)
	if (locale === "ja") return __ja.common_delete(inputs)
	if (locale === "ko") return __ko.common_delete(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_delete(inputs)
	return __ru.common_delete(inputs)
});
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Common_NameInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_name = /** @type {((inputs?: Common_NameInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_NameInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_name(inputs)
	if (locale === "es") return __es.common_name(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_name(inputs)
	if (locale === "fr") return __fr.common_name(inputs)
	if (locale === "de") return __de.common_name(inputs)
	if (locale === "ja") return __ja.common_name(inputs)
	if (locale === "ko") return __ko.common_name(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_name(inputs)
	return __ru.common_name(inputs)
});
/**
* | output |
* | --- |
* | "Refresh" |
*
* @param {Common_RefreshInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_refresh = /** @type {((inputs?: Common_RefreshInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_RefreshInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_refresh(inputs)
	if (locale === "es") return __es.common_refresh(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_refresh(inputs)
	if (locale === "fr") return __fr.common_refresh(inputs)
	if (locale === "de") return __de.common_refresh(inputs)
	if (locale === "ja") return __ja.common_refresh(inputs)
	if (locale === "ko") return __ko.common_refresh(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_refresh(inputs)
	return __ru.common_refresh(inputs)
});
/**
* | output |
* | --- |
* | "Manage" |
*
* @param {Common_ManageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_manage = /** @type {((inputs?: Common_ManageInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_ManageInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_manage(inputs)
	if (locale === "es") return __es.common_manage(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_manage(inputs)
	if (locale === "fr") return __fr.common_manage(inputs)
	if (locale === "de") return __de.common_manage(inputs)
	if (locale === "ja") return __ja.common_manage(inputs)
	if (locale === "ko") return __ko.common_manage(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_manage(inputs)
	return __ru.common_manage(inputs)
});
/**
* | output |
* | --- |
* | "Select all" |
*
* @param {Common_Selectall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const common_selectall1 = /** @type {((inputs?: Common_Selectall1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Selectall1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_selectall1(inputs)
	if (locale === "es") return __es.common_selectall1(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_selectall1(inputs)
	if (locale === "fr") return __fr.common_selectall1(inputs)
	if (locale === "de") return __de.common_selectall1(inputs)
	if (locale === "ja") return __ja.common_selectall1(inputs)
	if (locale === "ko") return __ko.common_selectall1(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_selectall1(inputs)
	return __ru.common_selectall1(inputs)
});
export { common_selectall1 as "common_selectAll" }
/**
* | output |
* | --- |
* | "Deselect all" |
*
* @param {Common_Deselectall1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const common_deselectall1 = /** @type {((inputs?: Common_Deselectall1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Deselectall1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_deselectall1(inputs)
	if (locale === "es") return __es.common_deselectall1(inputs)
	if (locale === "pt-PT") return __pt_pt2.common_deselectall1(inputs)
	if (locale === "fr") return __fr.common_deselectall1(inputs)
	if (locale === "de") return __de.common_deselectall1(inputs)
	if (locale === "ja") return __ja.common_deselectall1(inputs)
	if (locale === "ko") return __ko.common_deselectall1(inputs)
	if (locale === "zh-CN") return __zh_cn2.common_deselectall1(inputs)
	return __ru.common_deselectall1(inputs)
});
export { common_deselectall1 as "common_deselectAll" }
/**
* | output |
* | --- |
* | "Changes" |
*
* @param {Entity_ChangesInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_changes = /** @type {((inputs?: Entity_ChangesInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_ChangesInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.entity_changes(inputs)
	if (locale === "es") return __es.entity_changes(inputs)
	if (locale === "pt-PT") return __pt_pt2.entity_changes(inputs)
	if (locale === "fr") return __fr.entity_changes(inputs)
	if (locale === "de") return __de.entity_changes(inputs)
	if (locale === "ja") return __ja.entity_changes(inputs)
	if (locale === "ko") return __ko.entity_changes(inputs)
	if (locale === "zh-CN") return __zh_cn2.entity_changes(inputs)
	return __ru.entity_changes(inputs)
});
/**
* | output |
* | --- |
* | "Issues" |
*
* @param {Entity_IssuesInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_issues = /** @type {((inputs?: Entity_IssuesInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_IssuesInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.entity_issues(inputs)
	if (locale === "es") return __es.entity_issues(inputs)
	if (locale === "pt-PT") return __pt_pt2.entity_issues(inputs)
	if (locale === "fr") return __fr.entity_issues(inputs)
	if (locale === "de") return __de.entity_issues(inputs)
	if (locale === "ja") return __ja.entity_issues(inputs)
	if (locale === "ko") return __ko.entity_issues(inputs)
	if (locale === "zh-CN") return __zh_cn2.entity_issues(inputs)
	return __ru.entity_issues(inputs)
});
/**
* | output |
* | --- |
* | "Articles" |
*
* @param {Entity_ArticlesInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_articles = /** @type {((inputs?: Entity_ArticlesInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_ArticlesInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.entity_articles(inputs)
	if (locale === "es") return __es.entity_articles(inputs)
	if (locale === "pt-PT") return __pt_pt2.entity_articles(inputs)
	if (locale === "fr") return __fr.entity_articles(inputs)
	if (locale === "de") return __de.entity_articles(inputs)
	if (locale === "ja") return __ja.entity_articles(inputs)
	if (locale === "ko") return __ko.entity_articles(inputs)
	if (locale === "zh-CN") return __zh_cn2.entity_articles(inputs)
	return __ru.entity_articles(inputs)
});
/**
* | output |
* | --- |
* | "Other" |
*
* @param {Entity_OtherInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_other = /** @type {((inputs?: Entity_OtherInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Entity_OtherInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.entity_other(inputs)
	if (locale === "es") return __es.entity_other(inputs)
	if (locale === "pt-PT") return __pt_pt2.entity_other(inputs)
	if (locale === "fr") return __fr.entity_other(inputs)
	if (locale === "de") return __de.entity_other(inputs)
	if (locale === "ja") return __ja.entity_other(inputs)
	if (locale === "ko") return __ko.entity_other(inputs)
	if (locale === "zh-CN") return __zh_cn2.entity_other(inputs)
	return __ru.entity_other(inputs)
});
/**
* | output |
* | --- |
* | "Search or enter URL…" |
*
* @param {Sidebar_Searchplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_searchplaceholder1 = /** @type {((inputs?: Sidebar_Searchplaceholder1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Searchplaceholder1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_searchplaceholder1(inputs)
	if (locale === "es") return __es.sidebar_searchplaceholder1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_searchplaceholder1(inputs)
	if (locale === "fr") return __fr.sidebar_searchplaceholder1(inputs)
	if (locale === "de") return __de.sidebar_searchplaceholder1(inputs)
	if (locale === "ja") return __ja.sidebar_searchplaceholder1(inputs)
	if (locale === "ko") return __ko.sidebar_searchplaceholder1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_searchplaceholder1(inputs)
	return __ru.sidebar_searchplaceholder1(inputs)
});
export { sidebar_searchplaceholder1 as "sidebar_searchPlaceholder" }
/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Sidebar_Clearsearch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_clearsearch1 = /** @type {((inputs?: Sidebar_Clearsearch1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Clearsearch1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_clearsearch1(inputs)
	if (locale === "es") return __es.sidebar_clearsearch1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_clearsearch1(inputs)
	if (locale === "fr") return __fr.sidebar_clearsearch1(inputs)
	if (locale === "de") return __de.sidebar_clearsearch1(inputs)
	if (locale === "ja") return __ja.sidebar_clearsearch1(inputs)
	if (locale === "ko") return __ko.sidebar_clearsearch1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_clearsearch1(inputs)
	return __ru.sidebar_clearsearch1(inputs)
});
export { sidebar_clearsearch1 as "sidebar_clearSearch" }
/**
* | output |
* | --- |
* | "No favorites yet." |
*
* @param {Sidebar_Nofavorites1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_nofavorites1 = /** @type {((inputs?: Sidebar_Nofavorites1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Nofavorites1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_nofavorites1(inputs)
	if (locale === "es") return __es.sidebar_nofavorites1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_nofavorites1(inputs)
	if (locale === "fr") return __fr.sidebar_nofavorites1(inputs)
	if (locale === "de") return __de.sidebar_nofavorites1(inputs)
	if (locale === "ja") return __ja.sidebar_nofavorites1(inputs)
	if (locale === "ko") return __ko.sidebar_nofavorites1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_nofavorites1(inputs)
	return __ru.sidebar_nofavorites1(inputs)
});
export { sidebar_nofavorites1 as "sidebar_noFavorites" }
/**
* | output |
* | --- |
* | "Grant access" |
*
* @param {Sidebar_Lensgrantaccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensgrantaccess2 = /** @type {((inputs?: Sidebar_Lensgrantaccess2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensgrantaccess2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensgrantaccess2(inputs)
	if (locale === "es") return __es.sidebar_lensgrantaccess2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensgrantaccess2(inputs)
	if (locale === "fr") return __fr.sidebar_lensgrantaccess2(inputs)
	if (locale === "de") return __de.sidebar_lensgrantaccess2(inputs)
	if (locale === "ja") return __ja.sidebar_lensgrantaccess2(inputs)
	if (locale === "ko") return __ko.sidebar_lensgrantaccess2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensgrantaccess2(inputs)
	return __ru.sidebar_lensgrantaccess2(inputs)
});
export { sidebar_lensgrantaccess2 as "sidebar_lensGrantAccess" }
/**
* | output |
* | --- |
* | "Filtered" |
*
* @param {Sidebar_Lensfilteredbadge2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensfilteredbadge2 = /** @type {((inputs?: Sidebar_Lensfilteredbadge2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensfilteredbadge2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensfilteredbadge2(inputs)
	if (locale === "es") return __es.sidebar_lensfilteredbadge2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensfilteredbadge2(inputs)
	if (locale === "fr") return __fr.sidebar_lensfilteredbadge2(inputs)
	if (locale === "de") return __de.sidebar_lensfilteredbadge2(inputs)
	if (locale === "ja") return __ja.sidebar_lensfilteredbadge2(inputs)
	if (locale === "ko") return __ko.sidebar_lensfilteredbadge2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensfilteredbadge2(inputs)
	return __ru.sidebar_lensfilteredbadge2(inputs)
});
export { sidebar_lensfilteredbadge2 as "sidebar_lensFilteredBadge" }
/**
* | output |
* | --- |
* | "Open the feed's website in a new tab" |
*
* @param {Sidebar_Lensopenfeedsite3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensopenfeedsite3 = /** @type {((inputs?: Sidebar_Lensopenfeedsite3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensopenfeedsite3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensopenfeedsite3(inputs)
	if (locale === "es") return __es.sidebar_lensopenfeedsite3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensopenfeedsite3(inputs)
	if (locale === "fr") return __fr.sidebar_lensopenfeedsite3(inputs)
	if (locale === "de") return __de.sidebar_lensopenfeedsite3(inputs)
	if (locale === "ja") return __ja.sidebar_lensopenfeedsite3(inputs)
	if (locale === "ko") return __ko.sidebar_lensopenfeedsite3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensopenfeedsite3(inputs)
	return __ru.sidebar_lensopenfeedsite3(inputs)
});
export { sidebar_lensopenfeedsite3 as "sidebar_lensOpenFeedSite" }
/**
* | output |
* | --- |
* | "Read from" |
*
* @param {Sidebar_Lensreadfrom2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensreadfrom2 = /** @type {((inputs?: Sidebar_Lensreadfrom2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensreadfrom2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensreadfrom2(inputs)
	if (locale === "es") return __es.sidebar_lensreadfrom2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensreadfrom2(inputs)
	if (locale === "fr") return __fr.sidebar_lensreadfrom2(inputs)
	if (locale === "de") return __de.sidebar_lensreadfrom2(inputs)
	if (locale === "ja") return __ja.sidebar_lensreadfrom2(inputs)
	if (locale === "ko") return __ko.sidebar_lensreadfrom2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensreadfrom2(inputs)
	return __ru.sidebar_lensreadfrom2(inputs)
});
export { sidebar_lensreadfrom2 as "sidebar_lensReadFrom" }
/**
* | output |
* | --- |
* | "Pick the connections this lens watches — its type is derived." |
*
* @param {Sidebar_Lensreadfromhelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensreadfromhelp3 = /** @type {((inputs?: Sidebar_Lensreadfromhelp3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensreadfromhelp3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensreadfromhelp3(inputs)
	if (locale === "es") return __es.sidebar_lensreadfromhelp3(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensreadfromhelp3(inputs)
	if (locale === "fr") return __fr.sidebar_lensreadfromhelp3(inputs)
	if (locale === "de") return __de.sidebar_lensreadfromhelp3(inputs)
	if (locale === "ja") return __ja.sidebar_lensreadfromhelp3(inputs)
	if (locale === "ko") return __ko.sidebar_lensreadfromhelp3(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensreadfromhelp3(inputs)
	return __ru.sidebar_lensreadfromhelp3(inputs)
});
export { sidebar_lensreadfromhelp3 as "sidebar_lensReadFromHelp" }
/**
* | output |
* | --- |
* | "Search sources…" |
*
* @param {Sidebar_Lenssourcesearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenssourcesearch2 = /** @type {((inputs?: Sidebar_Lenssourcesearch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenssourcesearch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenssourcesearch2(inputs)
	if (locale === "es") return __es.sidebar_lenssourcesearch2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenssourcesearch2(inputs)
	if (locale === "fr") return __fr.sidebar_lenssourcesearch2(inputs)
	if (locale === "de") return __de.sidebar_lenssourcesearch2(inputs)
	if (locale === "ja") return __ja.sidebar_lenssourcesearch2(inputs)
	if (locale === "ko") return __ko.sidebar_lenssourcesearch2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenssourcesearch2(inputs)
	return __ru.sidebar_lenssourcesearch2(inputs)
});
export { sidebar_lenssourcesearch2 as "sidebar_lensSourceSearch" }
/**
* | output |
* | --- |
* | "Lens" |
*
* @param {Sidebar_Lensnameplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensnameplaceholder2 = /** @type {((inputs?: Sidebar_Lensnameplaceholder2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensnameplaceholder2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensnameplaceholder2(inputs)
	if (locale === "es") return __es.sidebar_lensnameplaceholder2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensnameplaceholder2(inputs)
	if (locale === "fr") return __fr.sidebar_lensnameplaceholder2(inputs)
	if (locale === "de") return __de.sidebar_lensnameplaceholder2(inputs)
	if (locale === "ja") return __ja.sidebar_lensnameplaceholder2(inputs)
	if (locale === "ko") return __ko.sidebar_lensnameplaceholder2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensnameplaceholder2(inputs)
	return __ru.sidebar_lensnameplaceholder2(inputs)
});
export { sidebar_lensnameplaceholder2 as "sidebar_lensNamePlaceholder" }
/**
* | output |
* | --- |
* | "Filters" |
*
* @param {Sidebar_Lensfilterslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensfilterslabel2 = /** @type {((inputs?: Sidebar_Lensfilterslabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensfilterslabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensfilterslabel2(inputs)
	if (locale === "es") return __es.sidebar_lensfilterslabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensfilterslabel2(inputs)
	if (locale === "fr") return __fr.sidebar_lensfilterslabel2(inputs)
	if (locale === "de") return __de.sidebar_lensfilterslabel2(inputs)
	if (locale === "ja") return __ja.sidebar_lensfilterslabel2(inputs)
	if (locale === "ko") return __ko.sidebar_lensfilterslabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensfilterslabel2(inputs)
	return __ru.sidebar_lensfilterslabel2(inputs)
});
export { sidebar_lensfilterslabel2 as "sidebar_lensFiltersLabel" }
/**
* | output |
* | --- |
* | "+ Connect a service" |
*
* @param {Sidebar_Lensconnectservice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensconnectservice2 = /** @type {((inputs?: Sidebar_Lensconnectservice2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensconnectservice2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensconnectservice2(inputs)
	if (locale === "es") return __es.sidebar_lensconnectservice2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensconnectservice2(inputs)
	if (locale === "fr") return __fr.sidebar_lensconnectservice2(inputs)
	if (locale === "de") return __de.sidebar_lensconnectservice2(inputs)
	if (locale === "ja") return __ja.sidebar_lensconnectservice2(inputs)
	if (locale === "ko") return __ko.sidebar_lensconnectservice2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensconnectservice2(inputs)
	return __ru.sidebar_lensconnectservice2(inputs)
});
export { sidebar_lensconnectservice2 as "sidebar_lensConnectService" }
/**
* | output |
* | --- |
* | "This lens will show" |
*
* @param {Sidebar_Lenswillshow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenswillshow2 = /** @type {((inputs?: Sidebar_Lenswillshow2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenswillshow2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenswillshow2(inputs)
	if (locale === "es") return __es.sidebar_lenswillshow2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenswillshow2(inputs)
	if (locale === "fr") return __fr.sidebar_lenswillshow2(inputs)
	if (locale === "de") return __de.sidebar_lenswillshow2(inputs)
	if (locale === "ja") return __ja.sidebar_lenswillshow2(inputs)
	if (locale === "ko") return __ko.sidebar_lenswillshow2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenswillshow2(inputs)
	return __ru.sidebar_lenswillshow2(inputs)
});
export { sidebar_lenswillshow2 as "sidebar_lensWillShow" }
/**
* | output |
* | --- |
* | "Space color" |
*
* @param {Sidebar_Spacecolorlabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spacecolorlabel2 = /** @type {((inputs?: Sidebar_Spacecolorlabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spacecolorlabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spacecolorlabel2(inputs)
	if (locale === "es") return __es.sidebar_spacecolorlabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spacecolorlabel2(inputs)
	if (locale === "fr") return __fr.sidebar_spacecolorlabel2(inputs)
	if (locale === "de") return __de.sidebar_spacecolorlabel2(inputs)
	if (locale === "ja") return __ja.sidebar_spacecolorlabel2(inputs)
	if (locale === "ko") return __ko.sidebar_spacecolorlabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spacecolorlabel2(inputs)
	return __ru.sidebar_spacecolorlabel2(inputs)
});
export { sidebar_spacecolorlabel2 as "sidebar_spaceColorLabel" }
/**
* | output |
* | --- |
* | "Change the default in Settings" |
*
* @param {Sidebar_Boundarychangedefault2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarychangedefault2 = /** @type {((inputs?: Sidebar_Boundarychangedefault2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarychangedefault2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundarychangedefault2(inputs)
	if (locale === "es") return __es.sidebar_boundarychangedefault2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundarychangedefault2(inputs)
	if (locale === "fr") return __fr.sidebar_boundarychangedefault2(inputs)
	if (locale === "de") return __de.sidebar_boundarychangedefault2(inputs)
	if (locale === "ja") return __ja.sidebar_boundarychangedefault2(inputs)
	if (locale === "ko") return __ko.sidebar_boundarychangedefault2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundarychangedefault2(inputs)
	return __ru.sidebar_boundarychangedefault2(inputs)
});
export { sidebar_boundarychangedefault2 as "sidebar_boundaryChangeDefault" }
/**
* | output |
* | --- |
* | "This tab navigates freely." |
*
* @param {Sidebar_Boundaryfree1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundaryfree1 = /** @type {((inputs?: Sidebar_Boundaryfree1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundaryfree1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundaryfree1(inputs)
	if (locale === "es") return __es.sidebar_boundaryfree1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundaryfree1(inputs)
	if (locale === "fr") return __fr.sidebar_boundaryfree1(inputs)
	if (locale === "de") return __de.sidebar_boundaryfree1(inputs)
	if (locale === "ja") return __ja.sidebar_boundaryfree1(inputs)
	if (locale === "ko") return __ko.sidebar_boundaryfree1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundaryfree1(inputs)
	return __ru.sidebar_boundaryfree1(inputs)
});
export { sidebar_boundaryfree1 as "sidebar_boundaryFree" }
/**
* | output |
* | --- |
* | "Links off this page open in a new tab." |
*
* @param {Sidebar_Boundarypagehelp2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarypagehelp2 = /** @type {((inputs?: Sidebar_Boundarypagehelp2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarypagehelp2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundarypagehelp2(inputs)
	if (locale === "es") return __es.sidebar_boundarypagehelp2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundarypagehelp2(inputs)
	if (locale === "fr") return __fr.sidebar_boundarypagehelp2(inputs)
	if (locale === "de") return __de.sidebar_boundarypagehelp2(inputs)
	if (locale === "ja") return __ja.sidebar_boundarypagehelp2(inputs)
	if (locale === "ko") return __ko.sidebar_boundarypagehelp2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundarypagehelp2(inputs)
	return __ru.sidebar_boundarypagehelp2(inputs)
});
export { sidebar_boundarypagehelp2 as "sidebar_boundaryPageHelp" }
/**
* | output |
* | --- |
* | "Pages this tab stays on" |
*
* @param {Sidebar_Boundarypageslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarypageslabel2 = /** @type {((inputs?: Sidebar_Boundarypageslabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarypageslabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundarypageslabel2(inputs)
	if (locale === "es") return __es.sidebar_boundarypageslabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundarypageslabel2(inputs)
	if (locale === "fr") return __fr.sidebar_boundarypageslabel2(inputs)
	if (locale === "de") return __de.sidebar_boundarypageslabel2(inputs)
	if (locale === "ja") return __ja.sidebar_boundarypageslabel2(inputs)
	if (locale === "ko") return __ko.sidebar_boundarypageslabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundarypageslabel2(inputs)
	return __ru.sidebar_boundarypageslabel2(inputs)
});
export { sidebar_boundarypageslabel2 as "sidebar_boundaryPagesLabel" }
/**
* | output |
* | --- |
* | "Clear filter" |
*
* @param {Launcher_Lensclearfilter2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensclearfilter2 = /** @type {((inputs?: Launcher_Lensclearfilter2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensclearfilter2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensclearfilter2(inputs)
	if (locale === "es") return __es.launcher_lensclearfilter2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensclearfilter2(inputs)
	if (locale === "fr") return __fr.launcher_lensclearfilter2(inputs)
	if (locale === "de") return __de.launcher_lensclearfilter2(inputs)
	if (locale === "ja") return __ja.launcher_lensclearfilter2(inputs)
	if (locale === "ko") return __ko.launcher_lensclearfilter2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensclearfilter2(inputs)
	return __ru.launcher_lensclearfilter2(inputs)
});
export { launcher_lensclearfilter2 as "launcher_lensClearFilter" }
/**
* | output |
* | --- |
* | "Unread · {count}" |
*
* @param {Launcher_Lensunread1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensunread1 = /** @type {((inputs: Launcher_Lensunread1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensunread1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensunread1(inputs)
	if (locale === "es") return __es.launcher_lensunread1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensunread1(inputs)
	if (locale === "fr") return __fr.launcher_lensunread1(inputs)
	if (locale === "de") return __de.launcher_lensunread1(inputs)
	if (locale === "ja") return __ja.launcher_lensunread1(inputs)
	if (locale === "ko") return __ko.launcher_lensunread1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensunread1(inputs)
	return __ru.launcher_lensunread1(inputs)
});
export { launcher_lensunread1 as "launcher_lensUnread" }
/**
* | output |
* | --- |
* | "Article layout" |
*
* @param {Launcher_Lensarticlelayout2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensarticlelayout2 = /** @type {((inputs?: Launcher_Lensarticlelayout2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensarticlelayout2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensarticlelayout2(inputs)
	if (locale === "es") return __es.launcher_lensarticlelayout2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensarticlelayout2(inputs)
	if (locale === "fr") return __fr.launcher_lensarticlelayout2(inputs)
	if (locale === "de") return __de.launcher_lensarticlelayout2(inputs)
	if (locale === "ja") return __ja.launcher_lensarticlelayout2(inputs)
	if (locale === "ko") return __ko.launcher_lensarticlelayout2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensarticlelayout2(inputs)
	return __ru.launcher_lensarticlelayout2(inputs)
});
export { launcher_lensarticlelayout2 as "launcher_lensArticleLayout" }
/**
* | output |
* | --- |
* | "Grid" |
*
* @param {Launcher_Lensgrid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensgrid1 = /** @type {((inputs?: Launcher_Lensgrid1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensgrid1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensgrid1(inputs)
	if (locale === "es") return __es.launcher_lensgrid1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensgrid1(inputs)
	if (locale === "fr") return __fr.launcher_lensgrid1(inputs)
	if (locale === "de") return __de.launcher_lensgrid1(inputs)
	if (locale === "ja") return __ja.launcher_lensgrid1(inputs)
	if (locale === "ko") return __ko.launcher_lensgrid1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensgrid1(inputs)
	return __ru.launcher_lensgrid1(inputs)
});
export { launcher_lensgrid1 as "launcher_lensGrid" }
/**
* | output |
* | --- |
* | "List" |
*
* @param {Launcher_Lenslist1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lenslist1 = /** @type {((inputs?: Launcher_Lenslist1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lenslist1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lenslist1(inputs)
	if (locale === "es") return __es.launcher_lenslist1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lenslist1(inputs)
	if (locale === "fr") return __fr.launcher_lenslist1(inputs)
	if (locale === "de") return __de.launcher_lenslist1(inputs)
	if (locale === "ja") return __ja.launcher_lenslist1(inputs)
	if (locale === "ko") return __ko.launcher_lenslist1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lenslist1(inputs)
	return __ru.launcher_lenslist1(inputs)
});
export { launcher_lenslist1 as "launcher_lensList" }
/**
* | output |
* | --- |
* | "This lens has nothing waiting right now." |
*
* @param {Launcher_Lensempty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensempty1 = /** @type {((inputs?: Launcher_Lensempty1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensempty1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensempty1(inputs)
	if (locale === "es") return __es.launcher_lensempty1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensempty1(inputs)
	if (locale === "fr") return __fr.launcher_lensempty1(inputs)
	if (locale === "de") return __de.launcher_lensempty1(inputs)
	if (locale === "ja") return __ja.launcher_lensempty1(inputs)
	if (locale === "ko") return __ko.launcher_lensempty1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensempty1(inputs)
	return __ru.launcher_lensempty1(inputs)
});
export { launcher_lensempty1 as "launcher_lensEmpty" }
/**
* | output |
* | --- |
* | "Waiting on you" |
*
* @param {Launcher_Lenswaitingonyou3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lenswaitingonyou3 = /** @type {((inputs?: Launcher_Lenswaitingonyou3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lenswaitingonyou3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lenswaitingonyou3(inputs)
	if (locale === "es") return __es.launcher_lenswaitingonyou3(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lenswaitingonyou3(inputs)
	if (locale === "fr") return __fr.launcher_lenswaitingonyou3(inputs)
	if (locale === "de") return __de.launcher_lenswaitingonyou3(inputs)
	if (locale === "ja") return __ja.launcher_lenswaitingonyou3(inputs)
	if (locale === "ko") return __ko.launcher_lenswaitingonyou3(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lenswaitingonyou3(inputs)
	return __ru.launcher_lenswaitingonyou3(inputs)
});
export { launcher_lenswaitingonyou3 as "launcher_lensWaitingOnYou" }
/**
* | output |
* | --- |
* | "review requested" |
*
* @param {Launcher_Lensreasonreview2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensreasonreview2 = /** @type {((inputs?: Launcher_Lensreasonreview2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensreasonreview2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensreasonreview2(inputs)
	if (locale === "es") return __es.launcher_lensreasonreview2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensreasonreview2(inputs)
	if (locale === "fr") return __fr.launcher_lensreasonreview2(inputs)
	if (locale === "de") return __de.launcher_lensreasonreview2(inputs)
	if (locale === "ja") return __ja.launcher_lensreasonreview2(inputs)
	if (locale === "ko") return __ko.launcher_lensreasonreview2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensreasonreview2(inputs)
	return __ru.launcher_lensreasonreview2(inputs)
});
export { launcher_lensreasonreview2 as "launcher_lensReasonReview" }
/**
* | output |
* | --- |
* | "CI failing" |
*
* @param {Launcher_Lensreasonci2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensreasonci2 = /** @type {((inputs?: Launcher_Lensreasonci2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensreasonci2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensreasonci2(inputs)
	if (locale === "es") return __es.launcher_lensreasonci2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensreasonci2(inputs)
	if (locale === "fr") return __fr.launcher_lensreasonci2(inputs)
	if (locale === "de") return __de.launcher_lensreasonci2(inputs)
	if (locale === "ja") return __ja.launcher_lensreasonci2(inputs)
	if (locale === "ko") return __ko.launcher_lensreasonci2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensreasonci2(inputs)
	return __ru.launcher_lensreasonci2(inputs)
});
export { launcher_lensreasonci2 as "launcher_lensReasonCi" }
/**
* | output |
* | --- |
* | "assigned to you" |
*
* @param {Launcher_Lensreasonassigned2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensreasonassigned2 = /** @type {((inputs?: Launcher_Lensreasonassigned2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensreasonassigned2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensreasonassigned2(inputs)
	if (locale === "es") return __es.launcher_lensreasonassigned2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensreasonassigned2(inputs)
	if (locale === "fr") return __fr.launcher_lensreasonassigned2(inputs)
	if (locale === "de") return __de.launcher_lensreasonassigned2(inputs)
	if (locale === "ja") return __ja.launcher_lensreasonassigned2(inputs)
	if (locale === "ko") return __ko.launcher_lensreasonassigned2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensreasonassigned2(inputs)
	return __ru.launcher_lensreasonassigned2(inputs)
});
export { launcher_lensreasonassigned2 as "launcher_lensReasonAssigned" }
/**
* | output |
* | --- |
* | "Unassigned" |
*
* @param {Launcher_Lensunassigned1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensunassigned1 = /** @type {((inputs?: Launcher_Lensunassigned1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensunassigned1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensunassigned1(inputs)
	if (locale === "es") return __es.launcher_lensunassigned1(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensunassigned1(inputs)
	if (locale === "fr") return __fr.launcher_lensunassigned1(inputs)
	if (locale === "de") return __de.launcher_lensunassigned1(inputs)
	if (locale === "ja") return __ja.launcher_lensunassigned1(inputs)
	if (locale === "ko") return __ko.launcher_lensunassigned1(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensunassigned1(inputs)
	return __ru.launcher_lensunassigned1(inputs)
});
export { launcher_lensunassigned1 as "launcher_lensUnassigned" }
/**
* | output |
* | --- |
* | "Accounts" |
*
* @param {Options_Accountsgrouptitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountsgrouptitle2 = /** @type {((inputs?: Options_Accountsgrouptitle2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountsgrouptitle2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_accountsgrouptitle2(inputs)
	if (locale === "es") return __es.options_accountsgrouptitle2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_accountsgrouptitle2(inputs)
	if (locale === "fr") return __fr.options_accountsgrouptitle2(inputs)
	if (locale === "de") return __de.options_accountsgrouptitle2(inputs)
	if (locale === "ja") return __ja.options_accountsgrouptitle2(inputs)
	if (locale === "ko") return __ko.options_accountsgrouptitle2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_accountsgrouptitle2(inputs)
	return __ru.options_accountsgrouptitle2(inputs)
});
export { options_accountsgrouptitle2 as "options_accountsGroupTitle" }
/**
* | output |
* | --- |
* | "Connections" |
*
* @param {Options_Connectionsheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_connectionsheading1 = /** @type {((inputs?: Options_Connectionsheading1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Connectionsheading1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_connectionsheading1(inputs)
	if (locale === "es") return __es.options_connectionsheading1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_connectionsheading1(inputs)
	if (locale === "fr") return __fr.options_connectionsheading1(inputs)
	if (locale === "de") return __de.options_connectionsheading1(inputs)
	if (locale === "ja") return __ja.options_connectionsheading1(inputs)
	if (locale === "ko") return __ko.options_connectionsheading1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_connectionsheading1(inputs)
	return __ru.options_connectionsheading1(inputs)
});
export { options_connectionsheading1 as "options_connectionsHeading" }
/**
* | output |
* | --- |
* | "Backup & restore" |
*
* @param {Options_Backupheading1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_backupheading1 = /** @type {((inputs?: Options_Backupheading1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Backupheading1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_backupheading1(inputs)
	if (locale === "es") return __es.options_backupheading1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_backupheading1(inputs)
	if (locale === "fr") return __fr.options_backupheading1(inputs)
	if (locale === "de") return __de.options_backupheading1(inputs)
	if (locale === "ja") return __ja.options_backupheading1(inputs)
	if (locale === "ko") return __ko.options_backupheading1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_backupheading1(inputs)
	return __ru.options_backupheading1(inputs)
});
export { options_backupheading1 as "options_backupHeading" }
/**
* | output |
* | --- |
* | "Feeds exported" |
*
* @param {Options_Feedsexported1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedsexported1 = /** @type {((inputs?: Options_Feedsexported1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedsexported1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_feedsexported1(inputs)
	if (locale === "es") return __es.options_feedsexported1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_feedsexported1(inputs)
	if (locale === "fr") return __fr.options_feedsexported1(inputs)
	if (locale === "de") return __de.options_feedsexported1(inputs)
	if (locale === "ja") return __ja.options_feedsexported1(inputs)
	if (locale === "ko") return __ko.options_feedsexported1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_feedsexported1(inputs)
	return __ru.options_feedsexported1(inputs)
});
export { options_feedsexported1 as "options_feedsExported" }
/**
* | output |
* | --- |
* | "{reach} · powers {entity}" |
*
* @param {Options_Accountreachline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_accountreachline2 = /** @type {((inputs: Options_Accountreachline2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Accountreachline2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_accountreachline2(inputs)
	if (locale === "es") return __es.options_accountreachline2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_accountreachline2(inputs)
	if (locale === "fr") return __fr.options_accountreachline2(inputs)
	if (locale === "de") return __de.options_accountreachline2(inputs)
	if (locale === "ja") return __ja.options_accountreachline2(inputs)
	if (locale === "ko") return __ko.options_accountreachline2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_accountreachline2(inputs)
	return __ru.options_accountreachline2(inputs)
});
export { options_accountreachline2 as "options_accountReachLine" }
/**
* | output |
* | --- |
* | "{feedUrl} · {reach} · powers {entity}" |
*
* @param {Options_Feedreachline2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_feedreachline2 = /** @type {((inputs: Options_Feedreachline2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Feedreachline2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_feedreachline2(inputs)
	if (locale === "es") return __es.options_feedreachline2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_feedreachline2(inputs)
	if (locale === "fr") return __fr.options_feedreachline2(inputs)
	if (locale === "de") return __de.options_feedreachline2(inputs)
	if (locale === "ja") return __ja.options_feedreachline2(inputs)
	if (locale === "ko") return __ko.options_feedreachline2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_feedreachline2(inputs)
	return __ru.options_feedreachline2(inputs)
});
export { options_feedreachline2 as "options_feedReachLine" }
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Still used in {count} lens — those sections will show \"account removed\"." |
* | "other" | "Still used in {count} lenses — those sections will show \"account removed\"." |
*
* @param {Options_Removeconfirmwarn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_removeconfirmwarn2 = /** @type {((inputs: Options_Removeconfirmwarn2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Removeconfirmwarn2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_removeconfirmwarn2(inputs)
	if (locale === "es") return __es.options_removeconfirmwarn2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_removeconfirmwarn2(inputs)
	if (locale === "fr") return __fr.options_removeconfirmwarn2(inputs)
	if (locale === "de") return __de.options_removeconfirmwarn2(inputs)
	if (locale === "ja") return __ja.options_removeconfirmwarn2(inputs)
	if (locale === "ko") return __ko.options_removeconfirmwarn2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_removeconfirmwarn2(inputs)
	return __ru.options_removeconfirmwarn2(inputs)
});
export { options_removeconfirmwarn2 as "options_removeConfirmWarn" }
/**
* | output |
* | --- |
* | "Filter by repo" |
*
* @param {Launcher_Lensfilterbyrepo3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfilterbyrepo3 = /** @type {((inputs?: Launcher_Lensfilterbyrepo3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfilterbyrepo3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensfilterbyrepo3(inputs)
	if (locale === "es") return __es.launcher_lensfilterbyrepo3(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensfilterbyrepo3(inputs)
	if (locale === "fr") return __fr.launcher_lensfilterbyrepo3(inputs)
	if (locale === "de") return __de.launcher_lensfilterbyrepo3(inputs)
	if (locale === "ja") return __ja.launcher_lensfilterbyrepo3(inputs)
	if (locale === "ko") return __ko.launcher_lensfilterbyrepo3(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensfilterbyrepo3(inputs)
	return __ru.launcher_lensfilterbyrepo3(inputs)
});
export { launcher_lensfilterbyrepo3 as "launcher_lensFilterByRepo" }
/**
* | output |
* | --- |
* | "Filter by project" |
*
* @param {Launcher_Lensfilterbyproject3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfilterbyproject3 = /** @type {((inputs?: Launcher_Lensfilterbyproject3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfilterbyproject3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensfilterbyproject3(inputs)
	if (locale === "es") return __es.launcher_lensfilterbyproject3(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensfilterbyproject3(inputs)
	if (locale === "fr") return __fr.launcher_lensfilterbyproject3(inputs)
	if (locale === "de") return __de.launcher_lensfilterbyproject3(inputs)
	if (locale === "ja") return __ja.launcher_lensfilterbyproject3(inputs)
	if (locale === "ko") return __ko.launcher_lensfilterbyproject3(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensfilterbyproject3(inputs)
	return __ru.launcher_lensfilterbyproject3(inputs)
});
export { launcher_lensfilterbyproject3 as "launcher_lensFilterByProject" }
/**
* | output |
* | --- |
* | "Filter by feed" |
*
* @param {Launcher_Lensfilterbyfeed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfilterbyfeed3 = /** @type {((inputs?: Launcher_Lensfilterbyfeed3Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfilterbyfeed3Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensfilterbyfeed3(inputs)
	if (locale === "es") return __es.launcher_lensfilterbyfeed3(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensfilterbyfeed3(inputs)
	if (locale === "fr") return __fr.launcher_lensfilterbyfeed3(inputs)
	if (locale === "de") return __de.launcher_lensfilterbyfeed3(inputs)
	if (locale === "ja") return __ja.launcher_lensfilterbyfeed3(inputs)
	if (locale === "ko") return __ko.launcher_lensfilterbyfeed3(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensfilterbyfeed3(inputs)
	return __ru.launcher_lensfilterbyfeed3(inputs)
});
export { launcher_lensfilterbyfeed3 as "launcher_lensFilterByFeed" }
/**
* | output |
* | --- |
* | "Include settings" |
*
* @param {Options_Includesettingslabel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_includesettingslabel2 = /** @type {((inputs?: Options_Includesettingslabel2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Includesettingslabel2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_includesettingslabel2(inputs)
	if (locale === "es") return __es.options_includesettingslabel2(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_includesettingslabel2(inputs)
	if (locale === "fr") return __fr.options_includesettingslabel2(inputs)
	if (locale === "de") return __de.options_includesettingslabel2(inputs)
	if (locale === "ja") return __ja.options_includesettingslabel2(inputs)
	if (locale === "ko") return __ko.options_includesettingslabel2(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_includesettingslabel2(inputs)
	return __ru.options_includesettingslabel2(inputs)
});
export { options_includesettingslabel2 as "options_includeSettingsLabel" }
/**
* | output |
* | --- |
* | "Favorite actions" |
*
* @param {Sidebar_Favoriteactions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_favoriteactions1 = /** @type {((inputs?: Sidebar_Favoriteactions1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Favoriteactions1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_favoriteactions1(inputs)
	if (locale === "es") return __es.sidebar_favoriteactions1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_favoriteactions1(inputs)
	if (locale === "fr") return __fr.sidebar_favoriteactions1(inputs)
	if (locale === "de") return __de.sidebar_favoriteactions1(inputs)
	if (locale === "ja") return __ja.sidebar_favoriteactions1(inputs)
	if (locale === "ko") return __ko.sidebar_favoriteactions1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_favoriteactions1(inputs)
	return __ru.sidebar_favoriteactions1(inputs)
});
export { sidebar_favoriteactions1 as "sidebar_favoriteActions" }
/**
* | output |
* | --- |
* | "Smart folder actions" |
*
* @param {Sidebar_Smartfolderactions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_smartfolderactions2 = /** @type {((inputs?: Sidebar_Smartfolderactions2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Smartfolderactions2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_smartfolderactions2(inputs)
	if (locale === "es") return __es.sidebar_smartfolderactions2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_smartfolderactions2(inputs)
	if (locale === "fr") return __fr.sidebar_smartfolderactions2(inputs)
	if (locale === "de") return __de.sidebar_smartfolderactions2(inputs)
	if (locale === "ja") return __ja.sidebar_smartfolderactions2(inputs)
	if (locale === "ko") return __ko.sidebar_smartfolderactions2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_smartfolderactions2(inputs)
	return __ru.sidebar_smartfolderactions2(inputs)
});
export { sidebar_smartfolderactions2 as "sidebar_smartFolderActions" }
/**
* | output |
* | --- |
* | "Maximum items" |
*
* @param {Sidebar_Lensmaxitems2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensmaxitems2 = /** @type {((inputs?: Sidebar_Lensmaxitems2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensmaxitems2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensmaxitems2(inputs)
	if (locale === "es") return __es.sidebar_lensmaxitems2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensmaxitems2(inputs)
	if (locale === "fr") return __fr.sidebar_lensmaxitems2(inputs)
	if (locale === "de") return __de.sidebar_lensmaxitems2(inputs)
	if (locale === "ja") return __ja.sidebar_lensmaxitems2(inputs)
	if (locale === "ko") return __ko.sidebar_lensmaxitems2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensmaxitems2(inputs)
	return __ru.sidebar_lensmaxitems2(inputs)
});
export { sidebar_lensmaxitems2 as "sidebar_lensMaxItems" }
/**
* | output |
* | --- |
* | "Refresh cadence" |
*
* @param {Sidebar_Lensrefreshcadence2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrefreshcadence2 = /** @type {((inputs?: Sidebar_Lensrefreshcadence2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrefreshcadence2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensrefreshcadence2(inputs)
	if (locale === "es") return __es.sidebar_lensrefreshcadence2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensrefreshcadence2(inputs)
	if (locale === "fr") return __fr.sidebar_lensrefreshcadence2(inputs)
	if (locale === "de") return __de.sidebar_lensrefreshcadence2(inputs)
	if (locale === "ja") return __ja.sidebar_lensrefreshcadence2(inputs)
	if (locale === "ko") return __ko.sidebar_lensrefreshcadence2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensrefreshcadence2(inputs)
	return __ru.sidebar_lensrefreshcadence2(inputs)
});
export { sidebar_lensrefreshcadence2 as "sidebar_lensRefreshCadence" }
/**
* | output |
* | --- |
* | "Tab actions" |
*
* @param {Sidebar_Tabactions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_tabactions1 = /** @type {((inputs?: Sidebar_Tabactions1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Tabactions1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_tabactions1(inputs)
	if (locale === "es") return __es.sidebar_tabactions1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_tabactions1(inputs)
	if (locale === "fr") return __fr.sidebar_tabactions1(inputs)
	if (locale === "de") return __de.sidebar_tabactions1(inputs)
	if (locale === "ja") return __ja.sidebar_tabactions1(inputs)
	if (locale === "ko") return __ko.sidebar_tabactions1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_tabactions1(inputs)
	return __ru.sidebar_tabactions1(inputs)
});
export { sidebar_tabactions1 as "sidebar_tabActions" }
/**
* | output |
* | --- |
* | "Open options" |
*
* @param {Sidebar_Openoptionsaria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_openoptionsaria2 = /** @type {((inputs?: Sidebar_Openoptionsaria2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Openoptionsaria2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_openoptionsaria2(inputs)
	if (locale === "es") return __es.sidebar_openoptionsaria2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_openoptionsaria2(inputs)
	if (locale === "fr") return __fr.sidebar_openoptionsaria2(inputs)
	if (locale === "de") return __de.sidebar_openoptionsaria2(inputs)
	if (locale === "ja") return __ja.sidebar_openoptionsaria2(inputs)
	if (locale === "ko") return __ko.sidebar_openoptionsaria2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_openoptionsaria2(inputs)
	return __ru.sidebar_openoptionsaria2(inputs)
});
export { sidebar_openoptionsaria2 as "sidebar_openOptionsAria" }
/**
* | output |
* | --- |
* | "Add a URL pattern" |
*
* @param {Sidebar_Boundaryaddpattern2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundaryaddpattern2 = /** @type {((inputs?: Sidebar_Boundaryaddpattern2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundaryaddpattern2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundaryaddpattern2(inputs)
	if (locale === "es") return __es.sidebar_boundaryaddpattern2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundaryaddpattern2(inputs)
	if (locale === "fr") return __fr.sidebar_boundaryaddpattern2(inputs)
	if (locale === "de") return __de.sidebar_boundaryaddpattern2(inputs)
	if (locale === "ja") return __ja.sidebar_boundaryaddpattern2(inputs)
	if (locale === "ko") return __ko.sidebar_boundaryaddpattern2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundaryaddpattern2(inputs)
	return __ru.sidebar_boundaryaddpattern2(inputs)
});
export { sidebar_boundaryaddpattern2 as "sidebar_boundaryAddPattern" }
/**
* | output |
* | --- |
* | "https://example.com/inbox*" |
*
* @param {Sidebar_Boundaryurlplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundaryurlplaceholder2 = /** @type {((inputs?: Sidebar_Boundaryurlplaceholder2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundaryurlplaceholder2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "es") return __es.sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "fr") return __fr.sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "de") return __de.sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "ja") return __ja.sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "ko") return __ko.sidebar_boundaryurlplaceholder2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundaryurlplaceholder2(inputs)
	return __ru.sidebar_boundaryurlplaceholder2(inputs)
});
export { sidebar_boundaryurlplaceholder2 as "sidebar_boundaryUrlPlaceholder" }
/**
* | output |
* | --- |
* | "Idle minutes before archiving" |
*
* @param {Sidebar_Idleminutesaria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_idleminutesaria2 = /** @type {((inputs?: Sidebar_Idleminutesaria2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Idleminutesaria2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_idleminutesaria2(inputs)
	if (locale === "es") return __es.sidebar_idleminutesaria2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_idleminutesaria2(inputs)
	if (locale === "fr") return __fr.sidebar_idleminutesaria2(inputs)
	if (locale === "de") return __de.sidebar_idleminutesaria2(inputs)
	if (locale === "ja") return __ja.sidebar_idleminutesaria2(inputs)
	if (locale === "ko") return __ko.sidebar_idleminutesaria2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_idleminutesaria2(inputs)
	return __ru.sidebar_idleminutesaria2(inputs)
});
export { sidebar_idleminutesaria2 as "sidebar_idleMinutesAria" }
/**
* | output |
* | --- |
* | "All repos" |
*
* @param {Launcher_Lensallrepos2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensallrepos2 = /** @type {((inputs?: Launcher_Lensallrepos2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensallrepos2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensallrepos2(inputs)
	if (locale === "es") return __es.launcher_lensallrepos2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensallrepos2(inputs)
	if (locale === "fr") return __fr.launcher_lensallrepos2(inputs)
	if (locale === "de") return __de.launcher_lensallrepos2(inputs)
	if (locale === "ja") return __ja.launcher_lensallrepos2(inputs)
	if (locale === "ko") return __ko.launcher_lensallrepos2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensallrepos2(inputs)
	return __ru.launcher_lensallrepos2(inputs)
});
export { launcher_lensallrepos2 as "launcher_lensAllRepos" }
/**
* | output |
* | --- |
* | "All projects" |
*
* @param {Launcher_Lensallprojects2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensallprojects2 = /** @type {((inputs?: Launcher_Lensallprojects2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensallprojects2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensallprojects2(inputs)
	if (locale === "es") return __es.launcher_lensallprojects2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensallprojects2(inputs)
	if (locale === "fr") return __fr.launcher_lensallprojects2(inputs)
	if (locale === "de") return __de.launcher_lensallprojects2(inputs)
	if (locale === "ja") return __ja.launcher_lensallprojects2(inputs)
	if (locale === "ko") return __ko.launcher_lensallprojects2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensallprojects2(inputs)
	return __ru.launcher_lensallprojects2(inputs)
});
export { launcher_lensallprojects2 as "launcher_lensAllProjects" }
/**
* | output |
* | --- |
* | "All feeds" |
*
* @param {Launcher_Lensallfeeds2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensallfeeds2 = /** @type {((inputs?: Launcher_Lensallfeeds2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensallfeeds2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensallfeeds2(inputs)
	if (locale === "es") return __es.launcher_lensallfeeds2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensallfeeds2(inputs)
	if (locale === "fr") return __fr.launcher_lensallfeeds2(inputs)
	if (locale === "de") return __de.launcher_lensallfeeds2(inputs)
	if (locale === "ja") return __ja.launcher_lensallfeeds2(inputs)
	if (locale === "ko") return __ko.launcher_lensallfeeds2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensallfeeds2(inputs)
	return __ru.launcher_lensallfeeds2(inputs)
});
export { launcher_lensallfeeds2 as "launcher_lensAllFeeds" }
/**
* | output |
* | --- |
* | "{count} selected" |
*
* @param {Launcher_Lensscopeselected2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensscopeselected2 = /** @type {((inputs: Launcher_Lensscopeselected2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensscopeselected2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensscopeselected2(inputs)
	if (locale === "es") return __es.launcher_lensscopeselected2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensscopeselected2(inputs)
	if (locale === "fr") return __fr.launcher_lensscopeselected2(inputs)
	if (locale === "de") return __de.launcher_lensscopeselected2(inputs)
	if (locale === "ja") return __ja.launcher_lensscopeselected2(inputs)
	if (locale === "ko") return __ko.launcher_lensscopeselected2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensscopeselected2(inputs)
	return __ru.launcher_lensscopeselected2(inputs)
});
export { launcher_lensscopeselected2 as "launcher_lensScopeSelected" }
/**
* | output |
* | --- |
* | "Search…" |
*
* @param {Launcher_Lensscopesearch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensscopesearch2 = /** @type {((inputs?: Launcher_Lensscopesearch2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensscopesearch2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.launcher_lensscopesearch2(inputs)
	if (locale === "es") return __es.launcher_lensscopesearch2(inputs)
	if (locale === "pt-PT") return __pt_pt2.launcher_lensscopesearch2(inputs)
	if (locale === "fr") return __fr.launcher_lensscopesearch2(inputs)
	if (locale === "de") return __de.launcher_lensscopesearch2(inputs)
	if (locale === "ja") return __ja.launcher_lensscopesearch2(inputs)
	if (locale === "ko") return __ko.launcher_lensscopesearch2(inputs)
	if (locale === "zh-CN") return __zh_cn2.launcher_lensscopesearch2(inputs)
	return __ru.launcher_lensscopesearch2(inputs)
});
export { launcher_lensscopesearch2 as "launcher_lensScopeSearch" }
/**
* | output |
* | --- |
* | "Authored" |
*
* @param {Sidebar_Lensroleauthored2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensroleauthored2 = /** @type {((inputs?: Sidebar_Lensroleauthored2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensroleauthored2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensroleauthored2(inputs)
	if (locale === "es") return __es.sidebar_lensroleauthored2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensroleauthored2(inputs)
	if (locale === "fr") return __fr.sidebar_lensroleauthored2(inputs)
	if (locale === "de") return __de.sidebar_lensroleauthored2(inputs)
	if (locale === "ja") return __ja.sidebar_lensroleauthored2(inputs)
	if (locale === "ko") return __ko.sidebar_lensroleauthored2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensroleauthored2(inputs)
	return __ru.sidebar_lensroleauthored2(inputs)
});
export { sidebar_lensroleauthored2 as "sidebar_lensRoleAuthored" }
/**
* | output |
* | --- |
* | "Assigned" |
*
* @param {Sidebar_Lensroleassigned2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensroleassigned2 = /** @type {((inputs?: Sidebar_Lensroleassigned2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensroleassigned2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensroleassigned2(inputs)
	if (locale === "es") return __es.sidebar_lensroleassigned2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensroleassigned2(inputs)
	if (locale === "fr") return __fr.sidebar_lensroleassigned2(inputs)
	if (locale === "de") return __de.sidebar_lensroleassigned2(inputs)
	if (locale === "ja") return __ja.sidebar_lensroleassigned2(inputs)
	if (locale === "ko") return __ko.sidebar_lensroleassigned2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensroleassigned2(inputs)
	return __ru.sidebar_lensroleassigned2(inputs)
});
export { sidebar_lensroleassigned2 as "sidebar_lensRoleAssigned" }
/**
* | output |
* | --- |
* | "Copy link" |
*
* @param {Sidebar_Copylink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_copylink1 = /** @type {((inputs?: Sidebar_Copylink1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Copylink1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_copylink1(inputs)
	if (locale === "es") return __es.sidebar_copylink1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_copylink1(inputs)
	if (locale === "fr") return __fr.sidebar_copylink1(inputs)
	if (locale === "de") return __de.sidebar_copylink1(inputs)
	if (locale === "ja") return __ja.sidebar_copylink1(inputs)
	if (locale === "ko") return __ko.sidebar_copylink1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_copylink1(inputs)
	return __ru.sidebar_copylink1(inputs)
});
export { sidebar_copylink1 as "sidebar_copyLink" }
/**
* | output |
* | --- |
* | "Move left" |
*
* @param {Sidebar_Moveleft1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_moveleft1 = /** @type {((inputs?: Sidebar_Moveleft1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Moveleft1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_moveleft1(inputs)
	if (locale === "es") return __es.sidebar_moveleft1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_moveleft1(inputs)
	if (locale === "fr") return __fr.sidebar_moveleft1(inputs)
	if (locale === "de") return __de.sidebar_moveleft1(inputs)
	if (locale === "ja") return __ja.sidebar_moveleft1(inputs)
	if (locale === "ko") return __ko.sidebar_moveleft1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_moveleft1(inputs)
	return __ru.sidebar_moveleft1(inputs)
});
export { sidebar_moveleft1 as "sidebar_moveLeft" }
/**
* | output |
* | --- |
* | "Move right" |
*
* @param {Sidebar_Moveright1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_moveright1 = /** @type {((inputs?: Sidebar_Moveright1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Moveright1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_moveright1(inputs)
	if (locale === "es") return __es.sidebar_moveright1(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_moveright1(inputs)
	if (locale === "fr") return __fr.sidebar_moveright1(inputs)
	if (locale === "de") return __de.sidebar_moveright1(inputs)
	if (locale === "ja") return __ja.sidebar_moveright1(inputs)
	if (locale === "ko") return __ko.sidebar_moveright1(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_moveright1(inputs)
	return __ru.sidebar_moveright1(inputs)
});
export { sidebar_moveright1 as "sidebar_moveRight" }
/**
* | output |
* | --- |
* | "Remove from favorites" |
*
* @param {Sidebar_Removefromfavorites2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_removefromfavorites2 = /** @type {((inputs?: Sidebar_Removefromfavorites2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Removefromfavorites2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_removefromfavorites2(inputs)
	if (locale === "es") return __es.sidebar_removefromfavorites2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_removefromfavorites2(inputs)
	if (locale === "fr") return __fr.sidebar_removefromfavorites2(inputs)
	if (locale === "de") return __de.sidebar_removefromfavorites2(inputs)
	if (locale === "ja") return __ja.sidebar_removefromfavorites2(inputs)
	if (locale === "ko") return __ko.sidebar_removefromfavorites2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_removefromfavorites2(inputs)
	return __ru.sidebar_removefromfavorites2(inputs)
});
export { sidebar_removefromfavorites2 as "sidebar_removeFromFavorites" }
/**
* | output |
* | --- |
* | "Every 5 minutes" |
*
* @param {Sidebar_Lenscadence51Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadence51 = /** @type {((inputs?: Sidebar_Lenscadence51Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadence51Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenscadence51(inputs)
	if (locale === "es") return __es.sidebar_lenscadence51(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenscadence51(inputs)
	if (locale === "fr") return __fr.sidebar_lenscadence51(inputs)
	if (locale === "de") return __de.sidebar_lenscadence51(inputs)
	if (locale === "ja") return __ja.sidebar_lenscadence51(inputs)
	if (locale === "ko") return __ko.sidebar_lenscadence51(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenscadence51(inputs)
	return __ru.sidebar_lenscadence51(inputs)
});
export { sidebar_lenscadence51 as "sidebar_lensCadence5" }
/**
* | output |
* | --- |
* | "Every 10 minutes" |
*
* @param {Sidebar_Lenscadence101Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadence101 = /** @type {((inputs?: Sidebar_Lenscadence101Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadence101Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenscadence101(inputs)
	if (locale === "es") return __es.sidebar_lenscadence101(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenscadence101(inputs)
	if (locale === "fr") return __fr.sidebar_lenscadence101(inputs)
	if (locale === "de") return __de.sidebar_lenscadence101(inputs)
	if (locale === "ja") return __ja.sidebar_lenscadence101(inputs)
	if (locale === "ko") return __ko.sidebar_lenscadence101(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenscadence101(inputs)
	return __ru.sidebar_lenscadence101(inputs)
});
export { sidebar_lenscadence101 as "sidebar_lensCadence10" }
/**
* | output |
* | --- |
* | "Every 30 minutes" |
*
* @param {Sidebar_Lenscadence301Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadence301 = /** @type {((inputs?: Sidebar_Lenscadence301Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadence301Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenscadence301(inputs)
	if (locale === "es") return __es.sidebar_lenscadence301(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenscadence301(inputs)
	if (locale === "fr") return __fr.sidebar_lenscadence301(inputs)
	if (locale === "de") return __de.sidebar_lenscadence301(inputs)
	if (locale === "ja") return __ja.sidebar_lenscadence301(inputs)
	if (locale === "ko") return __ko.sidebar_lenscadence301(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenscadence301(inputs)
	return __ru.sidebar_lenscadence301(inputs)
});
export { sidebar_lenscadence301 as "sidebar_lensCadence30" }
/**
* | output |
* | --- |
* | "Every hour" |
*
* @param {Sidebar_Lenscadencehour2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenscadencehour2 = /** @type {((inputs?: Sidebar_Lenscadencehour2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenscadencehour2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenscadencehour2(inputs)
	if (locale === "es") return __es.sidebar_lenscadencehour2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenscadencehour2(inputs)
	if (locale === "fr") return __fr.sidebar_lenscadencehour2(inputs)
	if (locale === "de") return __de.sidebar_lenscadencehour2(inputs)
	if (locale === "ja") return __ja.sidebar_lenscadencehour2(inputs)
	if (locale === "ko") return __ko.sidebar_lenscadencehour2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenscadencehour2(inputs)
	return __ru.sidebar_lenscadencehour2(inputs)
});
export { sidebar_lenscadencehour2 as "sidebar_lensCadenceHour" }
/**
* | output |
* | --- |
* | "Default" |
*
* @param {Sidebar_Boundarymodedefault2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarymodedefault2 = /** @type {((inputs?: Sidebar_Boundarymodedefault2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarymodedefault2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundarymodedefault2(inputs)
	if (locale === "es") return __es.sidebar_boundarymodedefault2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundarymodedefault2(inputs)
	if (locale === "fr") return __fr.sidebar_boundarymodedefault2(inputs)
	if (locale === "de") return __de.sidebar_boundarymodedefault2(inputs)
	if (locale === "ja") return __ja.sidebar_boundarymodedefault2(inputs)
	if (locale === "ko") return __ko.sidebar_boundarymodedefault2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundarymodedefault2(inputs)
	return __ru.sidebar_boundarymodedefault2(inputs)
});
export { sidebar_boundarymodedefault2 as "sidebar_boundaryModeDefault" }
/**
* | output |
* | --- |
* | "Off" |
*
* @param {Sidebar_Boundarymodeoff2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarymodeoff2 = /** @type {((inputs?: Sidebar_Boundarymodeoff2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarymodeoff2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundarymodeoff2(inputs)
	if (locale === "es") return __es.sidebar_boundarymodeoff2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundarymodeoff2(inputs)
	if (locale === "fr") return __fr.sidebar_boundarymodeoff2(inputs)
	if (locale === "de") return __de.sidebar_boundarymodeoff2(inputs)
	if (locale === "ja") return __ja.sidebar_boundarymodeoff2(inputs)
	if (locale === "ko") return __ko.sidebar_boundarymodeoff2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundarymodeoff2(inputs)
	return __ru.sidebar_boundarymodeoff2(inputs)
});
export { sidebar_boundarymodeoff2 as "sidebar_boundaryModeOff" }
/**
* | output |
* | --- |
* | "On" |
*
* @param {Sidebar_Boundarymodeon2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_boundarymodeon2 = /** @type {((inputs?: Sidebar_Boundarymodeon2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Boundarymodeon2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_boundarymodeon2(inputs)
	if (locale === "es") return __es.sidebar_boundarymodeon2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_boundarymodeon2(inputs)
	if (locale === "fr") return __fr.sidebar_boundarymodeon2(inputs)
	if (locale === "de") return __de.sidebar_boundarymodeon2(inputs)
	if (locale === "ja") return __ja.sidebar_boundarymodeon2(inputs)
	if (locale === "ko") return __ko.sidebar_boundarymodeon2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_boundarymodeon2(inputs)
	return __ru.sidebar_boundarymodeon2(inputs)
});
export { sidebar_boundarymodeon2 as "sidebar_boundaryModeOn" }
/**
* | output |
* | --- |
* | "System" |
*
* @param {Options_Language_SystemInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_language_system = /** @type {((inputs?: Options_Language_SystemInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Language_SystemInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_language_system(inputs)
	if (locale === "es") return __es.options_language_system(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_language_system(inputs)
	if (locale === "fr") return __fr.options_language_system(inputs)
	if (locale === "de") return __de.options_language_system(inputs)
	if (locale === "ja") return __ja.options_language_system(inputs)
	if (locale === "ko") return __ko.options_language_system(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_language_system(inputs)
	return __ru.options_language_system(inputs)
});
/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Options_Engine_CustomInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_engine_custom = /** @type {((inputs?: Options_Engine_CustomInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Engine_CustomInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_engine_custom(inputs)
	if (locale === "es") return __es.options_engine_custom(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_engine_custom(inputs)
	if (locale === "fr") return __fr.options_engine_custom(inputs)
	if (locale === "de") return __de.options_engine_custom(inputs)
	if (locale === "ja") return __ja.options_engine_custom(inputs)
	if (locale === "ko") return __ko.options_engine_custom(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_engine_custom(inputs)
	return __ru.options_engine_custom(inputs)
});
/**
* | output |
* | --- |
* | "All Spaces" |
*
* @param {Options_Scope_GlobalInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_scope_global = /** @type {((inputs?: Options_Scope_GlobalInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Scope_GlobalInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_scope_global(inputs)
	if (locale === "es") return __es.options_scope_global(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_scope_global(inputs)
	if (locale === "fr") return __fr.options_scope_global(inputs)
	if (locale === "de") return __de.options_scope_global(inputs)
	if (locale === "ja") return __ja.options_scope_global(inputs)
	if (locale === "ko") return __ko.options_scope_global(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_scope_global(inputs)
	return __ru.options_scope_global(inputs)
});
/**
* | output |
* | --- |
* | "Prefer current Space" |
*
* @param {Options_Scope_Prefercurrent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_scope_prefercurrent1 = /** @type {((inputs?: Options_Scope_Prefercurrent1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Scope_Prefercurrent1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_scope_prefercurrent1(inputs)
	if (locale === "es") return __es.options_scope_prefercurrent1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_scope_prefercurrent1(inputs)
	if (locale === "fr") return __fr.options_scope_prefercurrent1(inputs)
	if (locale === "de") return __de.options_scope_prefercurrent1(inputs)
	if (locale === "ja") return __ja.options_scope_prefercurrent1(inputs)
	if (locale === "ko") return __ko.options_scope_prefercurrent1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_scope_prefercurrent1(inputs)
	return __ru.options_scope_prefercurrent1(inputs)
});
export { options_scope_prefercurrent1 as "options_scope_preferCurrent" }
/**
* | output |
* | --- |
* | "Current Space only" |
*
* @param {Options_Scope_Currentonly1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_scope_currentonly1 = /** @type {((inputs?: Options_Scope_Currentonly1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Scope_Currentonly1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_scope_currentonly1(inputs)
	if (locale === "es") return __es.options_scope_currentonly1(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_scope_currentonly1(inputs)
	if (locale === "fr") return __fr.options_scope_currentonly1(inputs)
	if (locale === "de") return __de.options_scope_currentonly1(inputs)
	if (locale === "ja") return __ja.options_scope_currentonly1(inputs)
	if (locale === "ko") return __ko.options_scope_currentonly1(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_scope_currentonly1(inputs)
	return __ru.options_scope_currentonly1(inputs)
});
export { options_scope_currentonly1 as "options_scope_currentOnly" }
/**
* | output |
* | --- |
* | "Compact" |
*
* @param {Options_Density_CompactInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_density_compact = /** @type {((inputs?: Options_Density_CompactInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Density_CompactInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_density_compact(inputs)
	if (locale === "es") return __es.options_density_compact(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_density_compact(inputs)
	if (locale === "fr") return __fr.options_density_compact(inputs)
	if (locale === "de") return __de.options_density_compact(inputs)
	if (locale === "ja") return __ja.options_density_compact(inputs)
	if (locale === "ko") return __ko.options_density_compact(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_density_compact(inputs)
	return __ru.options_density_compact(inputs)
});
/**
* | output |
* | --- |
* | "Normal" |
*
* @param {Options_Density_NormalInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_density_normal = /** @type {((inputs?: Options_Density_NormalInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Density_NormalInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_density_normal(inputs)
	if (locale === "es") return __es.options_density_normal(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_density_normal(inputs)
	if (locale === "fr") return __fr.options_density_normal(inputs)
	if (locale === "de") return __de.options_density_normal(inputs)
	if (locale === "ja") return __ja.options_density_normal(inputs)
	if (locale === "ko") return __ko.options_density_normal(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_density_normal(inputs)
	return __ru.options_density_normal(inputs)
});
/**
* | output |
* | --- |
* | "Comfort" |
*
* @param {Options_Density_ComfortInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_density_comfort = /** @type {((inputs?: Options_Density_ComfortInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Density_ComfortInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_density_comfort(inputs)
	if (locale === "es") return __es.options_density_comfort(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_density_comfort(inputs)
	if (locale === "fr") return __fr.options_density_comfort(inputs)
	if (locale === "de") return __de.options_density_comfort(inputs)
	if (locale === "ja") return __ja.options_density_comfort(inputs)
	if (locale === "ko") return __ko.options_density_comfort(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_density_comfort(inputs)
	return __ru.options_density_comfort(inputs)
});
/**
* | output |
* | --- |
* | "Subtle" |
*
* @param {Options_Tint_SubtleInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_tint_subtle = /** @type {((inputs?: Options_Tint_SubtleInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tint_SubtleInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_tint_subtle(inputs)
	if (locale === "es") return __es.options_tint_subtle(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_tint_subtle(inputs)
	if (locale === "fr") return __fr.options_tint_subtle(inputs)
	if (locale === "de") return __de.options_tint_subtle(inputs)
	if (locale === "ja") return __ja.options_tint_subtle(inputs)
	if (locale === "ko") return __ko.options_tint_subtle(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_tint_subtle(inputs)
	return __ru.options_tint_subtle(inputs)
});
/**
* | output |
* | --- |
* | "Standard" |
*
* @param {Options_Tint_StandardInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_tint_standard = /** @type {((inputs?: Options_Tint_StandardInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tint_StandardInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_tint_standard(inputs)
	if (locale === "es") return __es.options_tint_standard(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_tint_standard(inputs)
	if (locale === "fr") return __fr.options_tint_standard(inputs)
	if (locale === "de") return __de.options_tint_standard(inputs)
	if (locale === "ja") return __ja.options_tint_standard(inputs)
	if (locale === "ko") return __ko.options_tint_standard(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_tint_standard(inputs)
	return __ru.options_tint_standard(inputs)
});
/**
* | output |
* | --- |
* | "Vivid" |
*
* @param {Options_Tint_VividInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_tint_vivid = /** @type {((inputs?: Options_Tint_VividInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Tint_VividInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_tint_vivid(inputs)
	if (locale === "es") return __es.options_tint_vivid(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_tint_vivid(inputs)
	if (locale === "fr") return __fr.options_tint_vivid(inputs)
	if (locale === "de") return __de.options_tint_vivid(inputs)
	if (locale === "ja") return __ja.options_tint_vivid(inputs)
	if (locale === "ko") return __ko.options_tint_vivid(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_tint_vivid(inputs)
	return __ru.options_tint_vivid(inputs)
});
/**
* | output |
* | --- |
* | "Dark" |
*
* @param {Options_Theme_DarkInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_theme_dark = /** @type {((inputs?: Options_Theme_DarkInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Theme_DarkInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_theme_dark(inputs)
	if (locale === "es") return __es.options_theme_dark(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_theme_dark(inputs)
	if (locale === "fr") return __fr.options_theme_dark(inputs)
	if (locale === "de") return __de.options_theme_dark(inputs)
	if (locale === "ja") return __ja.options_theme_dark(inputs)
	if (locale === "ko") return __ko.options_theme_dark(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_theme_dark(inputs)
	return __ru.options_theme_dark(inputs)
});
/**
* | output |
* | --- |
* | "Light" |
*
* @param {Options_Theme_LightInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_theme_light = /** @type {((inputs?: Options_Theme_LightInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Theme_LightInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_theme_light(inputs)
	if (locale === "es") return __es.options_theme_light(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_theme_light(inputs)
	if (locale === "fr") return __fr.options_theme_light(inputs)
	if (locale === "de") return __de.options_theme_light(inputs)
	if (locale === "ja") return __ja.options_theme_light(inputs)
	if (locale === "ko") return __ko.options_theme_light(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_theme_light(inputs)
	return __ru.options_theme_light(inputs)
});
/**
* | output |
* | --- |
* | "Off" |
*
* @param {Options_Boundary_OffInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_boundary_off = /** @type {((inputs?: Options_Boundary_OffInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Boundary_OffInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_boundary_off(inputs)
	if (locale === "es") return __es.options_boundary_off(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_boundary_off(inputs)
	if (locale === "fr") return __fr.options_boundary_off(inputs)
	if (locale === "de") return __de.options_boundary_off(inputs)
	if (locale === "ja") return __ja.options_boundary_off(inputs)
	if (locale === "ko") return __ko.options_boundary_off(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_boundary_off(inputs)
	return __ru.options_boundary_off(inputs)
});
/**
* | output |
* | --- |
* | "Lock to domain" |
*
* @param {Options_Boundary_DomainInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_boundary_domain = /** @type {((inputs?: Options_Boundary_DomainInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Boundary_DomainInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_boundary_domain(inputs)
	if (locale === "es") return __es.options_boundary_domain(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_boundary_domain(inputs)
	if (locale === "fr") return __fr.options_boundary_domain(inputs)
	if (locale === "de") return __de.options_boundary_domain(inputs)
	if (locale === "ja") return __ja.options_boundary_domain(inputs)
	if (locale === "ko") return __ko.options_boundary_domain(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_boundary_domain(inputs)
	return __ru.options_boundary_domain(inputs)
});
/**
* | output |
* | --- |
* | "Lock to this page" |
*
* @param {Options_Boundary_PageInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_boundary_page = /** @type {((inputs?: Options_Boundary_PageInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Boundary_PageInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_boundary_page(inputs)
	if (locale === "es") return __es.options_boundary_page(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_boundary_page(inputs)
	if (locale === "fr") return __fr.options_boundary_page(inputs)
	if (locale === "de") return __de.options_boundary_page(inputs)
	if (locale === "ja") return __ja.options_boundary_page(inputs)
	if (locale === "ko") return __ko.options_boundary_page(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_boundary_page(inputs)
	return __ru.options_boundary_page(inputs)
});
/**
* | output |
* | --- |
* | "Off" |
*
* @param {Options_Toggle_OffInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_toggle_off = /** @type {((inputs?: Options_Toggle_OffInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Toggle_OffInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_toggle_off(inputs)
	if (locale === "es") return __es.options_toggle_off(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_toggle_off(inputs)
	if (locale === "fr") return __fr.options_toggle_off(inputs)
	if (locale === "de") return __de.options_toggle_off(inputs)
	if (locale === "ja") return __ja.options_toggle_off(inputs)
	if (locale === "ko") return __ko.options_toggle_off(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_toggle_off(inputs)
	return __ru.options_toggle_off(inputs)
});
/**
* | output |
* | --- |
* | "On" |
*
* @param {Options_Toggle_OnInputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const options_toggle_on = /** @type {((inputs?: Options_Toggle_OnInputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Toggle_OnInputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.options_toggle_on(inputs)
	if (locale === "es") return __es.options_toggle_on(inputs)
	if (locale === "pt-PT") return __pt_pt2.options_toggle_on(inputs)
	if (locale === "fr") return __fr.options_toggle_on(inputs)
	if (locale === "de") return __de.options_toggle_on(inputs)
	if (locale === "ja") return __ja.options_toggle_on(inputs)
	if (locale === "ko") return __ko.options_toggle_on(inputs)
	if (locale === "zh-CN") return __zh_cn2.options_toggle_on(inputs)
	return __ru.options_toggle_on(inputs)
});
/**
* | output |
* | --- |
* | "unread" |
*
* @param {Sidebar_Lenskindunread2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenskindunread2 = /** @type {((inputs?: Sidebar_Lenskindunread2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenskindunread2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenskindunread2(inputs)
	if (locale === "es") return __es.sidebar_lenskindunread2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenskindunread2(inputs)
	if (locale === "fr") return __fr.sidebar_lenskindunread2(inputs)
	if (locale === "de") return __de.sidebar_lenskindunread2(inputs)
	if (locale === "ja") return __ja.sidebar_lenskindunread2(inputs)
	if (locale === "ko") return __ko.sidebar_lenskindunread2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenskindunread2(inputs)
	return __ru.sidebar_lenskindunread2(inputs)
});
export { sidebar_lenskindunread2 as "sidebar_lensKindUnread" }
/**
* | output |
* | --- |
* | "items" |
*
* @param {Sidebar_Lenskinditems2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenskinditems2 = /** @type {((inputs?: Sidebar_Lenskinditems2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenskinditems2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenskinditems2(inputs)
	if (locale === "es") return __es.sidebar_lenskinditems2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenskinditems2(inputs)
	if (locale === "fr") return __fr.sidebar_lenskinditems2(inputs)
	if (locale === "de") return __de.sidebar_lenskinditems2(inputs)
	if (locale === "ja") return __ja.sidebar_lenskinditems2(inputs)
	if (locale === "ko") return __ko.sidebar_lenskinditems2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenskinditems2(inputs)
	return __ru.sidebar_lenskinditems2(inputs)
});
export { sidebar_lenskinditems2 as "sidebar_lensKindItems" }
/**
* | output |
* | --- |
* | "Create lens" |
*
* @param {Sidebar_Lenseditorcreate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lenseditorcreate2 = /** @type {((inputs?: Sidebar_Lenseditorcreate2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lenseditorcreate2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lenseditorcreate2(inputs)
	if (locale === "es") return __es.sidebar_lenseditorcreate2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lenseditorcreate2(inputs)
	if (locale === "fr") return __fr.sidebar_lenseditorcreate2(inputs)
	if (locale === "de") return __de.sidebar_lenseditorcreate2(inputs)
	if (locale === "ja") return __ja.sidebar_lenseditorcreate2(inputs)
	if (locale === "ko") return __ko.sidebar_lenseditorcreate2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lenseditorcreate2(inputs)
	return __ru.sidebar_lenseditorcreate2(inputs)
});
export { sidebar_lenseditorcreate2 as "sidebar_lensEditorCreate" }
/**
* | output |
* | --- |
* | "Watching" |
*
* @param {Sidebar_Lensrolewatching2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrolewatching2 = /** @type {((inputs?: Sidebar_Lensrolewatching2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrolewatching2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensrolewatching2(inputs)
	if (locale === "es") return __es.sidebar_lensrolewatching2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensrolewatching2(inputs)
	if (locale === "fr") return __fr.sidebar_lensrolewatching2(inputs)
	if (locale === "de") return __de.sidebar_lensrolewatching2(inputs)
	if (locale === "ja") return __ja.sidebar_lensrolewatching2(inputs)
	if (locale === "ko") return __ko.sidebar_lensrolewatching2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensrolewatching2(inputs)
	return __ru.sidebar_lensrolewatching2(inputs)
});
export { sidebar_lensrolewatching2 as "sidebar_lensRoleWatching" }
/**
* | output |
* | --- |
* | "Reviewing" |
*
* @param {Sidebar_Lensrolereviewing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_lensrolereviewing2 = /** @type {((inputs?: Sidebar_Lensrolereviewing2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Lensrolereviewing2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_lensrolereviewing2(inputs)
	if (locale === "es") return __es.sidebar_lensrolereviewing2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_lensrolereviewing2(inputs)
	if (locale === "fr") return __fr.sidebar_lensrolereviewing2(inputs)
	if (locale === "de") return __de.sidebar_lensrolereviewing2(inputs)
	if (locale === "ja") return __ja.sidebar_lensrolereviewing2(inputs)
	if (locale === "ko") return __ko.sidebar_lensrolereviewing2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_lensrolereviewing2(inputs)
	return __ru.sidebar_lensrolereviewing2(inputs)
});
export { sidebar_lensrolereviewing2 as "sidebar_lensRoleReviewing" }
/**
* | output |
* | --- |
* | "Edit {name}" |
*
* @param {Sidebar_Spaceeditaria2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_spaceeditaria2 = /** @type {((inputs: Sidebar_Spaceeditaria2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Spaceeditaria2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_spaceeditaria2(inputs)
	if (locale === "es") return __es.sidebar_spaceeditaria2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_spaceeditaria2(inputs)
	if (locale === "fr") return __fr.sidebar_spaceeditaria2(inputs)
	if (locale === "de") return __de.sidebar_spaceeditaria2(inputs)
	if (locale === "ja") return __ja.sidebar_spaceeditaria2(inputs)
	if (locale === "ko") return __ko.sidebar_spaceeditaria2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_spaceeditaria2(inputs)
	return __ru.sidebar_spaceeditaria2(inputs)
});
export { sidebar_spaceeditaria2 as "sidebar_spaceEditAria" }
/**
* | output |
* | --- |
* | "Drop to favorite" |
*
* @param {Sidebar_Favdrophint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_favdrophint2 = /** @type {((inputs?: Sidebar_Favdrophint2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Favdrophint2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_favdrophint2(inputs)
	if (locale === "es") return __es.sidebar_favdrophint2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_favdrophint2(inputs)
	if (locale === "fr") return __fr.sidebar_favdrophint2(inputs)
	if (locale === "de") return __de.sidebar_favdrophint2(inputs)
	if (locale === "ja") return __ja.sidebar_favdrophint2(inputs)
	if (locale === "ko") return __ko.sidebar_favdrophint2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_favdrophint2(inputs)
	return __ru.sidebar_favdrophint2(inputs)
});
export { sidebar_favdrophint2 as "sidebar_favDropHint" }
/**
* | output |
* | --- |
* | "Drag a tab up here to favorite it." |
*
* @param {Sidebar_Favdraghint2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_favdraghint2 = /** @type {((inputs?: Sidebar_Favdraghint2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Favdraghint2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_favdraghint2(inputs)
	if (locale === "es") return __es.sidebar_favdraghint2(inputs)
	if (locale === "pt-PT") return __pt_pt2.sidebar_favdraghint2(inputs)
	if (locale === "fr") return __fr.sidebar_favdraghint2(inputs)
	if (locale === "de") return __de.sidebar_favdraghint2(inputs)
	if (locale === "ja") return __ja.sidebar_favdraghint2(inputs)
	if (locale === "ko") return __ko.sidebar_favdraghint2(inputs)
	if (locale === "zh-CN") return __zh_cn2.sidebar_favdraghint2(inputs)
	return __ru.sidebar_favdraghint2(inputs)
});
export { sidebar_favdraghint2 as "sidebar_favDragHint" }