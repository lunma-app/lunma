/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ modifier: NonNullable<unknown> }} Sidebar_Dragtabstopinhint4Inputs */

const en_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Drag a tab up here, or press ${i?.modifier}, to pin it.`)
};

const es_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Arrastra una pestaña aquí o pulsa ${i?.modifier} para fijarla.`)
};

const pt_pt2_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Arraste um separador até aqui ou prima ${i?.modifier} para o fixar.`)
};

const fr_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Glissez un onglet ici, ou appuyez sur ${i?.modifier}, pour l'épingler.`)
};

const de_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Tab hierher ziehen oder ${i?.modifier} drücken, um ihn anzuheften.`)
};

const ja_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`タブをここにドラッグ、または ${i?.modifier} を押して固定。`)
};

const ko_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`탭을 여기로 드래그하거나 ${i?.modifier}를 눌러 고정하세요.`)
};

const zh_cn2_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`将标签页拖到此处，或按 ${i?.modifier} 键固定`)
};

const ru_sidebar_dragtabstopinhint4 = /** @type {(inputs: Sidebar_Dragtabstopinhint4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Перетащите вкладку сюда или нажмите ${i?.modifier} для закрепления.`)
};

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
	if (locale === "en") return en_sidebar_dragtabstopinhint4(inputs)
	if (locale === "es") return es_sidebar_dragtabstopinhint4(inputs)
	if (locale === "pt-PT") return pt_pt2_sidebar_dragtabstopinhint4(inputs)
	if (locale === "fr") return fr_sidebar_dragtabstopinhint4(inputs)
	if (locale === "de") return de_sidebar_dragtabstopinhint4(inputs)
	if (locale === "ja") return ja_sidebar_dragtabstopinhint4(inputs)
	if (locale === "ko") return ko_sidebar_dragtabstopinhint4(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_dragtabstopinhint4(inputs)
	return ru_sidebar_dragtabstopinhint4(inputs)
});
export { sidebar_dragtabstopinhint4 as "sidebar_dragTabsToPinHint" }