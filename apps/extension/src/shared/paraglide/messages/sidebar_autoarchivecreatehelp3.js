/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Autoarchivecreatehelp3Inputs */

const en_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inherit the global setting, or set this Space's own idle-tab policy.`)
};

const es_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hereda la configuración global o define la política de pestañas inactivas de este espacio.`)
};

const pt_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herdar a definição global ou definir a política de separadores inativos deste Espaço.`)
};

const fr_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Héritez du réglage global ou définissez la politique d'inactivité propre à cet espace.`)
};

const de_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Globale Einstellung übernehmen oder eigene Idle-Tab-Regel für diesen Raum festlegen.`)
};

const ja_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`グローバル設定を継承するか、このスペース独自のアイドルタブポリシーを設定します。`)
};

const ko_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전역 설정을 상속하거나 이 스페이스의 유휴 탭 정책을 직접 설정하세요.`)
};

const zh_cn2_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`继承全局设置，或为此空间自定义闲置标签页策略`)
};

const ru_sidebar_autoarchivecreatehelp3 = /** @type {(inputs: Sidebar_Autoarchivecreatehelp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Унаследуйте глобальную настройку или задайте для этого пространства свою политику простоя вкладок.`)
};

/**
* | output |
* | --- |
* | "Inherit the global setting, or set this Space's own idle-tab policy." |
*
* @param {Sidebar_Autoarchivecreatehelp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_autoarchivecreatehelp3 = /** @type {((inputs?: Sidebar_Autoarchivecreatehelp3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Autoarchivecreatehelp3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "es") return es_sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "pt") return pt_sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "fr") return fr_sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "de") return de_sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "ja") return ja_sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "ko") return ko_sidebar_autoarchivecreatehelp3(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_autoarchivecreatehelp3(inputs)
	return ru_sidebar_autoarchivecreatehelp3(inputs)
});
export { sidebar_autoarchivecreatehelp3 as "sidebar_autoArchiveCreateHelp" }