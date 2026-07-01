/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Autoarchivegroupintro3Inputs */

const en_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tidy idle tabs away on their own — only temporary tabs, never your pinned ones — and restore them whenever you need.`)
};

const es_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiva automáticamente las pestañas inactivas — solo las temporales, nunca las fijadas — y recupéralas cuando quieras.`)
};

const pt_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organize separadores inativos automaticamente — apenas temporários, nunca os fixos — e restaure-os quando precisar.`)
};

const fr_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivez automatiquement les onglets inactifs — uniquement les temporaires, jamais les épinglés — et restaurez-les quand vous en avez besoin.`)
};

const de_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inaktive Tabs werden automatisch aufgeräumt — nur temporäre, nie angeheftete — und können jederzeit wiederhergestellt werden.`)
};

const ja_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`アイドル状態のタブを自動的に整理 — 一時タブのみ、固定タブは除外 — いつでも復元可能。`)
};

const ko_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`유휴 탭을 자동으로 정리합니다 — 임시 탭만, 고정 탭은 제외 — 언제든지 복원할 수 있습니다.`)
};

const zh_cn2_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`自动整理闲置标签页 — 仅针对临时标签页，固定标签页不受影响 — 随时可恢复`)
};

const ru_options_autoarchivegroupintro3 = /** @type {(inputs: Options_Autoarchivegroupintro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Автоматически убирает простаивающие вкладки — только временные, закреплённые не трогает — с возможностью восстановления в любое время.`)
};

/**
* | output |
* | --- |
* | "Tidy idle tabs away on their own — only temporary tabs, never your pinned ones — and restore them whenever you need." |
*
* @param {Options_Autoarchivegroupintro3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_autoarchivegroupintro3 = /** @type {((inputs?: Options_Autoarchivegroupintro3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Autoarchivegroupintro3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_autoarchivegroupintro3(inputs)
	if (locale === "es") return es_options_autoarchivegroupintro3(inputs)
	if (locale === "pt") return pt_options_autoarchivegroupintro3(inputs)
	if (locale === "fr") return fr_options_autoarchivegroupintro3(inputs)
	if (locale === "de") return de_options_autoarchivegroupintro3(inputs)
	if (locale === "ja") return ja_options_autoarchivegroupintro3(inputs)
	if (locale === "ko") return ko_options_autoarchivegroupintro3(inputs)
	if (locale === "zh-CN") return zh_cn2_options_autoarchivegroupintro3(inputs)
	return ru_options_autoarchivegroupintro3(inputs)
});
export { options_autoarchivegroupintro3 as "options_autoArchiveGroupIntro" }