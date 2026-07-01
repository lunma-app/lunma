/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Options_Archivedempty1Inputs */

const en_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nothing archived yet — idle temporary tabs land here so you can bring them back.`)
};

const es_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nada archivado aún — las pestañas temporales inactivas aparecen aquí para que puedas recuperarlas.`)
};

const pt_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ainda nada arquivado — os separadores temporários inativos ficam aqui para os poder recuperar.`)
};

const fr_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rien d'archivé pour l'instant — les onglets temporaires inactifs arrivent ici pour que vous puissiez les restaurer.`)
};

const de_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch nichts archiviert — inaktive temporäre Tabs landen hier zum Wiederherstellen.`)
};

const ja_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`まだアーカイブなし — アイドル状態の一時タブがここに保存され、復元できます。`)
};

const ko_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 보관된 항목이 없습니다 — 유휴 임시 탭이 여기에 쌓이면 복원할 수 있습니다.`)
};

const zh_cn2_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`暂无归档 — 闲置的临时标签页会在此沉淀，以便随时恢复`)
};

const ru_options_archivedempty1 = /** @type {(inputs: Options_Archivedempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Пока ничего нет — простаивающие временные вкладки появятся здесь для последующего восстановления.`)
};

/**
* | output |
* | --- |
* | "Nothing archived yet — idle temporary tabs land here so you can bring them back." |
*
* @param {Options_Archivedempty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const options_archivedempty1 = /** @type {((inputs?: Options_Archivedempty1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Options_Archivedempty1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_options_archivedempty1(inputs)
	if (locale === "es") return es_options_archivedempty1(inputs)
	if (locale === "pt") return pt_options_archivedempty1(inputs)
	if (locale === "fr") return fr_options_archivedempty1(inputs)
	if (locale === "de") return de_options_archivedempty1(inputs)
	if (locale === "ja") return ja_options_archivedempty1(inputs)
	if (locale === "ko") return ko_options_archivedempty1(inputs)
	if (locale === "zh-CN") return zh_cn2_options_archivedempty1(inputs)
	return ru_options_archivedempty1(inputs)
});
export { options_archivedempty1 as "options_archivedEmpty" }