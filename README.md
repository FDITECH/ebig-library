# ebig-library

A modern, lightweight React + TypeScript UI component library by **eBig** — 35+ ready-to-use components, a responsive layout system, design-token theming, built-in i18n (en/vi), and optional eBig backend integration for dynamic form/table/page rendering.

[![npm version](https://img.shields.io/npm/v/ebig-library)](https://www.npmjs.com/package/ebig-library)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Table of Contents

- [Installation](#installation)
- [Setup: EbigProvider](#setup-ebigprovider)
- [Global Context](#global-context)
- [Layout System](#layout-system)
- [Style / CSS](#style--css)
- [Components](#components)
  - [Button & SimpleButton](#button--simplebutton)
  - [Ebigicon](#ebigicon)
  - [TextField](#textfield)
  - [TextArea](#textarea)
  - [SelectDropdown](#selectdropdown)
  - [Checkbox](#checkbox)
  - [Switch](#switch)
  - [RadioButton](#radiobutton)
  - [DateTimePicker](#datetimepicker)
  - [NumberPicker](#numberpicker)
  - [Slider](#slider)
  - [Rating](#rating)
  - [InputOtp](#inputotp)
  - [ColorPicker](#colorpicker)
  - [Tag](#tag)
  - [Pagination](#pagination)
  - [InfiniteScroll](#infinitescroll)
  - [Dialog](#dialog)
  - [Popup](#popup)
  - [ToastMessage](#toastmessage)
  - [ProgressBar](#progressbar)
  - [ProgressCircle](#progresscircle)
  - [Calendar](#calendar)
  - [Carousel](#carousel)
  - [VideoPlayer / AudioPlayer / IframePlayer](#videoplayer--audioplayer--iframeplayer)
  - [ImportFile / UploadFiles](#importfile--uploadfiles)
  - [CustomCkEditor5](#customckeditor5)
  - [EbigEditor](#ebigeditor)
  - [IconPicker](#iconpicker)
  - [EmptyPage](#emptypage)
  - [Text](#text)
  - [ComponentStatus](#componentstatus)
- [Form Components (react-hook-form)](#form-components-react-hook-form)
- [Utility Class (Util)](#utility-class-util)
- [Controllers](#controllers)
  - [DataController](#datacontroller)
  - [SettingDataController](#settingdatacontroller)
  - [AccountController](#accountcontroller)
  - [EbigController](#ebigcontroller)
  - [TableController](#tablecontroller)
  - [IntegrationController](#integrationcontroller)
  - [BaseDA](#baseda)
- [Backend-Driven Modules](#backend-driven-modules)
- [Design Tokens & Theming](#design-tokens--theming)
- [Responsive Grid Classes](#responsive-grid-classes)

---

## Installation

```bash
npm install ebig-library
```

Import the CSS style files (required for layout and typography utilities):

```html
<!-- In your index.html or root CSS -->
<link rel="stylesheet" href="https://cdn.ebig.co/library/style/root.min.css" />
<link rel="stylesheet" href="https://cdn.ebig.co/library/style/layout.min.css" />
<link rel="stylesheet" href="https://cdn.ebig.co/library/style/typography.min.css" />
<link rel="stylesheet" href="https://cdn.ebig.co/library/style/toast-noti.min.css" />
```

> These are loaded automatically if you use `EbigProvider` with `loadResources={true}` (default).

---

## Setup: EbigProvider

Wrap your app's root with `EbigProvider`. It sets up routing (`BrowserRouter` internally), toast notifications, dialogs, token refresh, and optional design token + i18n loading from the eBig backend.

```tsx
// main.tsx
import ReactDOM from 'react-dom/client'
import EbigProvider, { Route } from 'ebig-library'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <EbigProvider
    pid="your-project-id"
    url="https://your-ebig-api.com/"
    fileUrl="https://your-file-server.com/"
    imgUrlId="https://your-cdn.com/"
    theme="light"           // "light" | "dark"
    loadResources={true}    // false → skip backend token/i18n loading
  >
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
  </EbigProvider>
)
```

> **Important:** `EbigProvider` wraps `BrowserRouter` internally. Do **not** add another `BrowserRouter` in your app.

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `pid` | `string` | ✅ | eBig project ID (32-char) |
| `url` | `string` | ✅ | eBig API base URL |
| `fileUrl` | `string` | ✅ | File server URL |
| `imgUrlId` | `string` | ✅ | CDN/image URL prefix |
| `theme` | `"light" \| "dark"` | — | Default `"light"` |
| `loadResources` | `boolean` | — | Default `true`. Set to `false` to skip backend loading |
| `onInvalidToken` | `() => void` | — | Called on 401 — override to redirect to login |
| `children` | `ReactNode` | — | `<Route>` elements |

---

## Global Context

```tsx
import { useEbigContext } from 'ebig-library'

function MyComponent() {
  const {
    theme,        // "light" | "dark"
    setTheme,
    userData,     // current user object (set by you)
    setUserData,
    globalData,   // any global state bag
    setGlobalData,
    i18n,         // i18next instance
  } = useEbigContext()

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Toggle theme
    </button>
  )
}
```

---

## Layout System

Use `row` and `col` CSS classes for flex layouts. Add `remain` to let a child fill remaining space.

```tsx
// Horizontal (flex-direction: row, align-items: center)
<div className="row" style={{ gap: 12 }}>
  <span>Left</span>
  <span className="remain">Stretches to fill space</span>
  <span>Right</span>
</div>

// Vertical (flex-direction: column)
<div className="col" style={{ gap: 8 }}>
  <span>Top</span>
  <span>Bottom</span>
</div>
```

---

## Style / CSS

| Resource | URL |
|---|---|
| Design tokens (CSS variables) | `https://cdn.ebig.co/library/style/root.min.css` |
| Layout utilities (`row`, `col`, grids) | `https://cdn.ebig.co/library/style/layout.min.css` |
| Typography (`heading-1`…`heading-8`, `body-1`…`body-3`) | `https://cdn.ebig.co/library/style/typography.min.css` |
| Toast styles | `https://cdn.ebig.co/library/style/toast-noti.min.css` |

---

## Components

### Button & SimpleButton

```tsx
import { Button, SimpleButton, Ebigicon } from 'ebig-library'

// Basic
<Button label="Click me" onClick={() => alert('clicked!')} />

// Size + color variant
<Button label="Save" className="size40 button-primary" onClick={handleSave} />

// With prefix icon
<Button
  label="Upload"
  prefix={<Ebigicon src="outline/arrows/cloud-upload" size={16} />}
  className="size40 button-neutral"
  onClick={handleUpload}
/>

// As a link
<Button label="Docs" linkTo="https://ebig.co" target="_blank" className="size40 button-grey" />

// With tooltip
<Button label="Info" tooltip={{ message: 'More details', position: 'top' }} />

// Submit — also triggers on Enter key
<Button label="Submit" type="submit" className="size40 button-primary" onClick={handleSubmit} />

// SimpleButton — auto-disables itself during async onClick to prevent double-clicks
<SimpleButton label="Save" className="size40 button-primary" onClick={async () => { await save() }} />
```

**Size classes:** `size24` · `size32` *(default)* · `size40` · `size48` · `size56` · `size64`

**Color classes:** `button-primary` · `button-grey` · `button-neutral` · `button-black` · `button-white` · `button-infor` · `button-warning` · `button-error` · `button-success` · `button-infor-main` · `button-warning-main` · `button-error-main` · `button-success-main`

---

### Ebigicon

SVG icon component. Icons are fetched from `https://cdn.ebig.co/icon-library/` and cached in the browser via the Cache API after first load.

```tsx
import { Ebigicon } from 'ebig-library'

<Ebigicon src="outline/user/user" size={24} />
<Ebigicon src="fill/actions/trash" size={20} color="#E14337" onClick={handleDelete} className="icon-button" />

// With tooltip
<Ebigicon src="outline/essential/info-circle" size={20} tooltip={{ message: 'Help', position: 'bottom' }} />

// From a custom link
<Ebigicon link="https://your-cdn.com/custom-icon.svg" size={24} />
```

**Style classes:** `icon-button` (adds hover/active styles) · `icon-button light` · `border` · `dashed`

**Size classes:** `size24` · `size32` · `size40` · `size48` · `size56` · `size64`

---

### TextField

```tsx
import { TextField, Ebigicon } from 'ebig-library'

<TextField placeholder="Enter name" onChange={(e) => setName(e.target.value)} />

// With prefix icon and helper text (shown in red below)
<TextField
  prefix={<Ebigicon src="outline/user/user" size={16} />}
  placeholder="Email"
  type="email"
  helperText="Invalid email"
  className="size40 body-3"
/>

// With react-hook-form
const { register } = useForm()
<TextField placeholder="Username" register={register('username', { required: true })} />
```

**Size classes:** `size24` · `size32` · `size40` *(default)* · `size48`

---

### TextArea

```tsx
import { TextArea } from 'ebig-library'

<TextArea placeholder="Write something..." onChange={(e) => setText(e.target.value)} />
```

---

### SelectDropdown

Single-value dropdown. Supports static options, async lazy-loading, hierarchical (parent/child) options, and `react-hook-form`.

```tsx
import { SelectDropdown } from 'ebig-library'

const options = [
  { id: '1', name: 'Option A' },
  { id: '2', name: 'Option B' },
  { id: '3', name: 'Option C', disabled: true },
]

// Static
<SelectDropdown
  value={selected}
  options={options}
  placeholder="Choose one"
  onChange={(item) => setSelected(item?.id)}
/>

// Async (loads on open / search)
<SelectDropdown
  options={[]}
  getOptions={async ({ length, search }) => {
    const res = await fetchItems({ page: Math.floor(length / 10) + 1, search })
    return { data: res.items, totalCount: res.total }
  }}
  onChange={(item) => setSelected(item?.id)}
/>
```

---

### Checkbox

```tsx
import { Checkbox } from 'ebig-library'

<Checkbox value={isChecked} onChange={(val) => setIsChecked(val)} />
<Checkbox value={null} />  {/* null = indeterminate */}
```

---

### Switch

```tsx
import { Switch } from 'ebig-library'

<Switch value={isOn} onChange={(val) => setIsOn(val)} />
<Switch value={isOn} size="2.4rem" onBackground="#287CF0" onChange={setIsOn} />
```

---

### RadioButton

```tsx
import { RadioButton } from 'ebig-library'

<RadioButton value={selected === 'a'} onChange={() => setSelected('a')} label="Option A" />
<RadioButton value={selected === 'b'} onChange={() => setSelected('b')} label="Option B" />
```

---

### DateTimePicker

```tsx
import { DateTimePicker } from 'ebig-library'

<DateTimePicker value={date} onChange={(val) => setDate(val)} placeholder="Pick a date" />
```

---

### NumberPicker

```tsx
import { NumberPicker } from 'ebig-library'

<NumberPicker value={count} onChange={(val) => setCount(val)} min={0} max={100} />
```

---

### Slider

```tsx
import { Slider } from 'ebig-library'

<Slider value={volume} min={0} max={100} onChange={(val) => setVolume(val)} />
```

---

### Rating

```tsx
import { Rating } from 'ebig-library'

<Rating value={3} onChange={(val) => setRating(val)} />
```

---

### InputOtp

```tsx
import { InputOtp } from 'ebig-library'

<InputOtp length={6} onComplete={(code) => verifyOtp(code)} />
```

---

### ColorPicker

```tsx
import { ColorPicker } from 'ebig-library'

<ColorPicker value={color} onChange={(hex) => setColor(hex)} />
```

---

### Tag

```tsx
import { Tag } from 'ebig-library'

<Tag label="Active" color="#287CF0" />
<Tag label="Error" color="#E14337" onRemove={() => handleRemove()} />
```

---

### Pagination

```tsx
import { Pagination } from 'ebig-library'

<Pagination
  pageIndex={page}
  totalCount={total}
  pageSize={10}
  onChange={(newPage) => setPage(newPage)}
/>
```

---

### InfiniteScroll

```tsx
import { InfiniteScroll } from 'ebig-library'

<InfiniteScroll
  data={items}
  render={(item) => <div key={item.id}>{item.name}</div>}
  totalCount={total}
  onLoadMore={() => loadNextPage()}
/>
```

---

### Dialog

```tsx
import { showDialog, DialogAlignment } from 'ebig-library'

showDialog({
  title: 'Confirm delete',
  content: 'Are you sure?',
  alignment: DialogAlignment.center,
  onConfirm: () => handleDelete(),
})
```

---

### Popup

```tsx
import { Popup, showPopup, closePopup } from 'ebig-library'
import { useRef } from 'react'

const ref = useRef()

<button onClick={(ev) => showPopup({ ref, id: 'my-popup', clickTarget: ev.currentTarget, content: () => <div>Content</div> })}>
  Open popup
</button>
<Popup ref={ref} />
```

---

### ToastMessage

```tsx
import { ToastMessage } from 'ebig-library'

ToastMessage.success('Saved successfully')
ToastMessage.errors('Something went wrong')
ToastMessage.warning('Check your input')
```

---

### ProgressBar

```tsx
import { ProgressBar } from 'ebig-library'

<ProgressBar percent={75} label="Uploading..." />
```

---

### ProgressCircle

```tsx
import { ProgressCircle } from 'ebig-library'

<ProgressCircle percent={60} size={80} />
```

---

### Calendar

```tsx
import { Calendar } from 'ebig-library'

<Calendar value={date} onChange={(val) => setDate(val)} />
```

---

### Carousel

```tsx
import { Carousel } from 'ebig-library'

<Carousel>
  <img src="/slide1.jpg" alt="Slide 1" />
  <img src="/slide2.jpg" alt="Slide 2" />
</Carousel>
```

---

### VideoPlayer / AudioPlayer / IframePlayer

```tsx
import { VideoPlayer, AudioPlayer, IframePlayer } from 'ebig-library'

<VideoPlayer src="https://example.com/video.mp4" />
<AudioPlayer src="https://example.com/audio.mp3" />
<IframePlayer src="https://www.youtube.com/embed/xxxxx" />
```

---

### ImportFile / UploadFiles

```tsx
import { ImportFile, UploadFiles } from 'ebig-library'

// File input with preview
<ImportFile
  value={files}
  onChange={(fileList) => setFiles(fileList)}
  maxSize={5 * 1024 * 1024} // 5 MB
  accept={['.png', '.jpg', '.pdf']}
/>

// Full upload flow with progress and CDN upload
<UploadFiles
  value={uploadedFiles}
  onChange={(files) => setUploadedFiles(files)}
/>
```

---

### CustomCkEditor5

Rich-text editor powered by CKEditor 5. Requires `ckeditor5` and `@ckeditor/ckeditor5-react` to be installed by the consumer.

```tsx
import { CustomCkEditor5, CkEditorUploadAdapter } from 'ebig-library'

<CustomCkEditor5
  value={html}
  onChange={(val) => setHtml(val)}
  uploadAdapter={CkEditorUploadAdapter}
/>
```

---

### EbigEditor

Lightweight rich-text editor (no CKEditor dependency). Supports emoji, bold, italic, underline, hyperlinks, and `@mention`-style suggestion hooks.

```tsx
import { EbigEditor } from 'ebig-library'

<EbigEditor
  placeholder="Write a comment..."
  onChange={(value, el) => setContent(value)}
  onBlur={(value, el) => handleBlur(value)}
/>

// Custom toolbar subset
<EbigEditor
  customToolbar={['bold', 'italic', 'emoji']}
  onChange={(val) => setContent(val)}
/>

// Mention suggestions
<EbigEditor
  onSuggest={[{
    triggerPattern: '@',
    render: (offset, match, select) => (
      <MentionList offset={offset} query={match} onSelect={select} />
    )
  }]}
  onChange={(val) => setContent(val)}
/>
```

---

### IconPicker

```tsx
import { IconPicker } from 'ebig-library'

<IconPicker value={iconName} onChange={(name) => setIconName(name)} />
```

---

### EmptyPage

```tsx
import { EmptyPage } from 'ebig-library'

<EmptyPage
  title="No data found"
  subtitle="Try adjusting your filters"
  button={<Button label="Reset" onClick={reset} />}
/>
```

---

### Text

Typography component that renders semantic HTML elements with typography class helpers.

```tsx
import { Text } from 'ebig-library'

<Text className="heading-3">Page title</Text>
<Text className="body-2" maxLine={2}>Truncated body text that wraps at two lines...</Text>
```

---

### ComponentStatus

```tsx
import { ComponentStatus, getStatusIcon } from 'ebig-library'

<ComponentStatus status="success" label="Completed" />
const icon = getStatusIcon('warning')
```

---

## Form Components (react-hook-form)

Pre-built form field wrappers integrating `react-hook-form`. All accept `methods` (from `useForm()`), `name`, `label`, `required`, `disabled`, `placeholder`, and `className`.

```tsx
import { useForm } from 'react-hook-form'
import {
  TextFieldForm,
  TextAreaForm,
  Select1Form,
  SelectMultipleForm,
  CheckboxForm,
  SwitchForm,
  DateTimePickerForm,
  NumberPickerForm,      // NumberPicker
  RateForm,              // Rating
  ColorPickerForm,
  GroupCheckboxForm,
  GroupRadioButtonForm,
  RangeForm,             // Slider
  CKEditorForm,
  EbigEditorForm,
  InputPasswordForm,
  IconPickerForm,
  UploadMultipleFileTypeForm,
} from 'ebig-library'

const methods = useForm()

<form onSubmit={methods.handleSubmit(onSubmit)}>
  <TextFieldForm methods={methods} name="username" label="Username" required />
  <TextFieldForm methods={methods} name="price" label="Price" type="money" />
  <Select1Form
    methods={methods}
    name="category"
    label="Category"
    options={[{ id: '1', name: 'Tech' }, { id: '2', name: 'Finance' }]}
  />
  <DateTimePickerForm methods={methods} name="dueDate" label="Due date" />
  <EbigEditorForm methods={methods} name="description" label="Description" />
  <Button label="Submit" type="submit" className="size40 button-primary" />
</form>
```

---

## Utility Class (Util)

```tsx
import { Util } from 'ebig-library'

// Date & Time
Util.dateTime_stringToDecimal('2026-04-08T10:00:00Z') // → Unix seconds
Util.stringToDate('08/04/2026', 'dd/mm/yyyy')         // → Date
Util.calculateAge('01/01/2000')                        // → number

// Number & Currency
Util.formatCurrency(1500000, 'VND')   // → "1,500,000.00 ₫"
Util.formatCurrency(99.9, 'USD')      // → "$99.90"
Util.convertCurrency(100, 'USD', 'VND') // → 2450000

// Color
Util.hexToRgb('#287CF0')              // → { r: 40, g: 124, b: 240 }
Util.rgbToHex(40, 124, 240)           // → "#287cf0"

// String
Util.toSlug('Hello World!')           // → "hello-world"
Util.randomGID()                      // → 32-char random hex ID

// Cookie
Util.getCookie('accessToken')
Util.setCookie('accessToken', token)
Util.clearCookie()

// File
Util.formatFileSize(1048576)          // → "1 MB"
Util.stringToFile('content', 'file.txt')

// Auth
Util.encodeBase64('string')
Util.decodeBase64('encoded')
```

---

## Controllers

All controllers require `ConfigData.url` and `ConfigData.pid` to be set (done automatically by `EbigProvider`).

### DataController

Generic CRUD for any project data module.

```tsx
import { DataController } from 'ebig-library'

const ctrl = new DataController('Product')

// Fetch list (RediSearch query syntax)
const res = await ctrl.getListSimple({ page: 1, size: 20, query: '@Category:{Electronics}' })

// Get by ID
const item = await ctrl.getById('abc123')

// Add
await ctrl.add([{ Name: 'Product A', Price: 100 }])

// Edit
await ctrl.edit([{ Id: 'abc123', Price: 120 }])

// Delete
await ctrl.delete(['abc123', 'def456'])

// Aggregate / group
await ctrl.aggregateList({ filter: '@Price:[100 200]', sortby: [{ prop: 'Price', direction: 'ASC' }] })
```

### SettingDataController

For system-level setting entities (`chart`, `form`, `card`, `view`).

```tsx
import { SettingDataController } from 'ebig-library'

const ctrl = new SettingDataController('form')
await ctrl.getListSimple({ page: 1, size: 10 })
await ctrl.action('add', { data: [{ Name: 'My Form' }] })
await ctrl.getByIds(['id1', 'id2'])
```

### AccountController

Login, get user info, and password utilities.

```tsx
import { AccountController } from 'ebig-library'

const acc = new AccountController('Customer') // or 'User'

// Login with account/password
const res = await acc.login({ type: 'account', username: 'admin', password: 'pass' })

// Login with Google OAuth token
await acc.login({ type: 'google', token: googleToken })

// Get current user info
const info = await acc.getInfor()

// Hash a password
const hashed = await acc.hashPassword('mypassword')
```

### EbigController

Project-level queries (fetches eBig project metadata). **Do not change the internal API paths.**

```tsx
import { EbigController } from 'ebig-library'

const ctrl = new EbigController('Project')
const project = await ctrl.getById('your-project-id')
const results = await ctrl.getListSimple({ query: '@Domain:{ebig.co}', size: 1 })
```

### TableController

CRUD for schema-level settings (`table`, `column`, `rel`, `menu`, `page`, `layout`, `designtoken`, `workflow`, `process`, `step`).

```tsx
import { TableController } from 'ebig-library'

const ctrl = new TableController('table')
const tables = await ctrl.getAll()
await ctrl.add([{ Name: 'Orders' }])
await ctrl.edit([{ Id: 'xxx', Name: 'OrdersV2' }])
await ctrl.delete(['xxx'])
```

### IntegrationController

```tsx
import { IntegrationController } from 'ebig-library'

const integration = new IntegrationController()
await integration.sendEmail({
  templateId: 'welcome-email',
  templateParams: { to: 'user@example.com', name: 'Alice' }
})
```

### BaseDA

Low-level HTTP helpers used by all controllers. Use directly only when you need calls outside the standard controller pattern.

```tsx
import { BaseDA, ConfigData } from 'ebig-library'

// GET (auto-injects auth headers for ConfigData.url requests)
const data = await BaseDA.get(`${ConfigData.url}data/custom-endpoint`, {
  headers: { pid: ConfigData.pid }
})

// POST
await BaseDA.post(`${ConfigData.url}data/action?action=add`, {
  headers: { pid: ConfigData.pid, module: 'Product' },
  body: { data: [{ Name: 'Item' }] }
})

// Upload files (auto-batches: max 12 files / 200 MB per batch)
const uploaded = await BaseDA.uploadFiles(fileList)
// uploaded → [{ Id, Url, Name, ... }]
```

---

## Backend-Driven Modules

Render entire UI sections driven by eBig backend configuration. Requires a valid `pid`/`url` in `EbigProvider`.

```tsx
import { PageById, PageByUrl, FormById, CardById, ViewById, ChartById, ChartByType } from 'ebig-library'

// Render a full page by its backend ID
<PageById id="page-id" />

// Render a page by URL path (matches current URL)
<PageByUrl url="location.pathname" />

// Render a form by ID
<FormById id="form-id" onSuccess={(data) => console.log(data)} />

// Render a card layout by ID
<CardById id="card-id" />

// Render a data view by ID
<ViewById id="view-id" />

// Chart by backend config ID
<ChartById id="chart-id" />

// Chart by type with your own data
<ChartByType type="bar" data={chartData} />
```

---

## Design Tokens & Theming

Design tokens are loaded from the eBig backend at runtime and injected as CSS custom properties into `<head>`. Toggle dark mode via `setTheme`:

```tsx
const { theme, setTheme } = useEbigContext()
setTheme('dark')  // adds class="dark" to <html>
```

Tokens follow the pattern:

```css
/* Light mode */
--primary-main-color: #287CF0;
--neutral-text-title-color: #18181B;

/* Dark mode (html.dark) */
--primary-main-color: #4A90E2;
--neutral-text-title-color: #EAEAEC;
```

---

## Responsive Grid Classes

The layout system uses a **24-column grid**. Add these classes to children inside a `row`.

| Class | Columns | Notes |
|---|---|---|
| `col1` – `col24` | 1/24 – 24/24 | Always applied |
| `remain` | fills rest | `flex: 1` |
| `col1-min` – `col24-min` | at **< 576px** | phones |
| `col1-sm` – `col24-sm` | at **≥ 576px** | small devices |
| `col1-md` – `col24-md` | at **≥ 768px** | tablets |
| `col1-lg` – `col24-lg` | at **≥ 992px** | laptops |
| `col1-xl` – `col24-xl` | at **≥ 1200px** | desktops |
| `col1-xxl` – `col24-xxl` | at **> 1200px** | wide screens |

```tsx
// 2-column on desktop, stacks on mobile
<div className="row" style={{ gap: 16 }}>
  <div className="col24 col12-lg" style={{ "--gutter": "16px" }}>Left panel</div>
  <div className="col24 col12-lg" style={{ "--gutter": "16px" }}>Right panel</div>
</div>
```

---

## License

MIT © [eBig / FDITECH](https://github.com/FDITECH)
