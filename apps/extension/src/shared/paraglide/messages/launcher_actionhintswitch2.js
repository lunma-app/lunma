/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Actionhintswitch2Inputs */

const en_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Switch  ⇧↵ New tab`)
};

const es_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Cambiar  ⇧↵ Nueva pestaña`)
};

const pt_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Mudar  ⇧↵ Novo separador`)
};

const fr_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Basculer  ⇧↵ Nouvel onglet`)
};

const de_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Wechseln  ⇧↵ Neuer Tab`)
};

const ja_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ 切り替え  ⇧↵ 新しいタブ`)
};

const ko_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ 전환  ⇧↵ 새 탭`)
};

const zh_cn2_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ 切换  ⇧↵ 新标签页`)
};

const ru_launcher_actionhintswitch2 = /** @type {(inputs: Launcher_Actionhintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Переключить  ⇧↵ Новая вкладка`)
};

/**
* | output |
* | --- |
* | "↵ Switch ⇧↵ New tab" |
*
* @param {Launcher_Actionhintswitch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_actionhintswitch2 = /** @type {((inputs?: Launcher_Actionhintswitch2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Actionhintswitch2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_actionhintswitch2(inputs)
	if (locale === "es") return es_launcher_actionhintswitch2(inputs)
	if (locale === "pt") return pt_launcher_actionhintswitch2(inputs)
	if (locale === "fr") return fr_launcher_actionhintswitch2(inputs)
	if (locale === "de") return de_launcher_actionhintswitch2(inputs)
	if (locale === "ja") return ja_launcher_actionhintswitch2(inputs)
	if (locale === "ko") return ko_launcher_actionhintswitch2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_actionhintswitch2(inputs)
	return ru_launcher_actionhintswitch2(inputs)
});
export { launcher_actionhintswitch2 as "launcher_actionHintSwitch" }