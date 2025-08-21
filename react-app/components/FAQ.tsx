
import { Accordion, Flex } from '@mantine/core';
import { data } from '../staticContent/FAQ.json';

export default function FAQ(): React.ReactElement {
  const items = data.map((item) => (
    <Accordion.Item key={item.value} value={item.value} >
      <Accordion.Control><h3>{item.title}</h3></Accordion.Control>
      <Accordion.Panel>
        <Flex
          gap='md'>
          <div>{item.description}</div>
          {item.videoUrl && <iframe id="video" src={item.videoUrl} />}
        </Flex>
      </Accordion.Panel>
    </Accordion.Item >
  ));

  return (
    <Accordion defaultValue="what" style={{ width: '100%' }}>
      {items}
    </Accordion>
  );
}