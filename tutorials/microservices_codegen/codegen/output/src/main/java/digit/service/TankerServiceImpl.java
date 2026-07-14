package digit.service;

import org.springframework.stereotype.Service;

@Service
public class TankerServiceImpl implements TankerService {

    @Override
    public void create() {
        System.out.println("Create Tanker");
    }

    @Override
    public void update() {
        System.out.println("Update Tanker");
    }

    @Override
    public void search() {
        System.out.println("Search Tanker");
    }

}