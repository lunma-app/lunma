/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Desc_Dedupnewtabnavigations3Inputs */

const en_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When you open a new tab and go to a page that's already open in this space, switch to it instead of opening a duplicate`)
};

const es_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Al abrir una pestaña nueva con una página ya abierta en este espacio, cambia a ella en lugar de duplicarla`)
};

const pt_pt2_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quando abre um novo separador e navega para uma página já aberta neste Space, muda para ela em vez de abrir uma duplicada`)
};

const fr_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quand vous ouvrez un nouvel onglet et naviguez vers une page déjà ouverte dans cet espace, basculez dessus plutôt que d'ouvrir un doublon`)
};

const de_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigiert ein neuer Tab zu einer Seite, die in diesem Space bereits offen ist, wird dorthin gewechselt — kein Duplikat`)
};

const ja_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新しいタブを開き、このスペースで既に開いているページに移動すると、重複を開く代わりに切り替えます`)
};

const ko_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 스페이스에 이미 열려 있는 페이지로 새 탭에서 이동하면 중복 열기 대신 해당 탭으로 전환합니다`)
};

const zh_cn2_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`新建标签页并访问当前空间中已打开的页面时，切换到该页面而非打开副本`)
};

const ru_options_desc_dedupnewtabnavigations3 = /** @type {(inputs: Options_Desc_Dedupnewtabnavigations3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Если при открытии новой вкладки страница уже открыта в этом пространстве — перейти к ней вместо дубликата`)
};

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
	if (locale === "en") return en_options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "es") return es_options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "pt-PT") return pt_pt2_options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "fr") return fr_options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "de") return de_options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "ja") return ja_options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "ko") return ko_options_desc_dedupnewtabnavigations3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_desc_dedupnewtabnavigations3(inputs)
	return ru_options_desc_dedupnewtabnavigations3(inputs)
});
export { options_desc_dedupnewtabnavigations3 as "options_desc_dedupNewTabNavigations" }