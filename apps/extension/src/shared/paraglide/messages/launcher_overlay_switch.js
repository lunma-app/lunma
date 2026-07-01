/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Overlay_SwitchInputs */

const en_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch`)
};

const es_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar`)
};

const pt_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mudar`)
};

const fr_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basculer`)
};

const de_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wechseln`)
};

const ja_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`切り替え`)
};

const ko_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전환`)
};

const zh_cn2_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`切换`)
};

const ru_launcher_overlay_switch = /** @type {(inputs: Launcher_Overlay_SwitchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Переключить`)
};

/**
* | output |
* | --- |
* | "Switch" |
*
* @param {Launcher_Overlay_SwitchInputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
export const launcher_overlay_switch = /** @type {((inputs?: Launcher_Overlay_SwitchInputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Overlay_SwitchInputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_overlay_switch(inputs)
	if (locale === "es") return es_launcher_overlay_switch(inputs)
	if (locale === "pt") return pt_launcher_overlay_switch(inputs)
	if (locale === "fr") return fr_launcher_overlay_switch(inputs)
	if (locale === "de") return de_launcher_overlay_switch(inputs)
	if (locale === "ja") return ja_launcher_overlay_switch(inputs)
	if (locale === "ko") return ko_launcher_overlay_switch(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_overlay_switch(inputs)
	return ru_launcher_overlay_switch(inputs)
});