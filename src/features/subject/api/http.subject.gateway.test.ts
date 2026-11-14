import {expect,it,vi} from 'vitest';
import {HttpSubjectGateway} from './http.subject.gateway';
import {SubjectService} from '../service/subject.service';
it('matches subject CRUD and cursor contracts including 204 delete',async()=>{
 const dto={id:'s',name:'Math',category:'Science',description:null};const h={get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn(),patch:vi.fn()};const g=new HttpSubjectGateway(h);
 h.get.mockResolvedValueOnce({content:[dto],hasNext:true,nextCursor:'s'}).mockResolvedValueOnce(dto);
 const p=await g.getPage({limit:10,cursor:'old'});expect(p.nextCursor).toBe('s');expect(p.content[0].description).toBeUndefined();expect(h.get).toHaveBeenCalledWith('/v1/subjects?cursor=old&limit=10');await g.getById('s');expect(h.get).toHaveBeenLastCalledWith('/v1/subjects/s');
 const body={name:'Math',category:'Science'};h.post.mockResolvedValue(dto);h.put.mockResolvedValue(dto);h.delete.mockResolvedValue(undefined);await g.create(body);await g.update('s',body);await g.remove('s');expect(h.post).toHaveBeenCalledWith('/v1/subjects',body);expect(h.put).toHaveBeenCalledWith('/v1/subjects/s',body);expect(h.delete).toHaveBeenCalledWith('/v1/subjects/s');
});
it('collects all subject cursor pages',async()=>{
 const h={get:vi.fn(),post:vi.fn(),put:vi.fn(),delete:vi.fn(),patch:vi.fn()};h.get.mockResolvedValueOnce({content:[{id:'a',name:'A'}],hasNext:true,nextCursor:'a'}).mockResolvedValueOnce({content:[{id:'b',name:'B'}],hasNext:false});
 expect((await new SubjectService(new HttpSubjectGateway(h)).getAll()).map(s=>s.id)).toEqual(['a','b']);expect(h.get).toHaveBeenLastCalledWith('/v1/subjects?cursor=a&limit=50');
});
