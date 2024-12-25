import {
  Form,
  FormGroup,
  Checkbox,
  RadioButtonGroup,
  RadioButton,
  Select,
  SelectItem,
  Button,
  FileUploader,
  TextInput ,
  NumberInput 
} from "carbon-components-svelte";

const componentDict = {
  Form,
  FormGroup,
  Checkbox,
  RadioButtonGroup,
  RadioButton,
  Select,
  SelectItem,
  Button,
  FileUploader,
  TextInput ,
  NumberInput 
};

export default componentDict;

export type FormSettings = {
  type: keyof typeof componentDict,
  children: FormSettings[],
  [key: string]: any
}